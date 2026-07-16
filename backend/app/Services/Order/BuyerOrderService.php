<?php

namespace App\Services\Order;

use App\Models\Farm;
use App\Models\Order;
use App\Models\Product;
use App\Models\SubOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Services\Payment\MomoPaymentService;

class BuyerOrderService
{
    public function __construct(
        private InventoryService $inventoryService,
        private MomoPaymentService $momoPaymentService,
    ) {
    }

    public function retryMomoPayment(int $userId, int $orderId): array
    {
        $order = Order::with(['payment', 'subOrders'])->where('user_id', $userId)->findOrFail($orderId);
        if (!$order->payment || $order->payment->payment_method !== 'MOMO') {
            throw ValidationException::withMessages(['payment' => ['Đơn hàng không sử dụng MoMo.']]);
        }
        if ((int) $order->payment->status === 1) {
            throw ValidationException::withMessages(['payment' => ['Đơn hàng đã được thanh toán.']]);
        }
        $this->ensurePaymentMethodCanChange($order);

        $order->payment->update([
            'status' => 0,
            'transaction_code' => 'PAY' . now()->format('YmdHis') . random_int(1000, 9999),
        ]);
        return $this->momoPaymentService->createPayment($order->fresh('payment'));
    }

    public function changePendingPaymentMethod(int $userId, int $orderId, string $paymentMethod): array
    {
        $order = Order::with(['payment', 'subOrders'])
            ->where('user_id', $userId)
            ->findOrFail($orderId);

        $this->ensurePaymentMethodCanChange($order);

        $paymentMethod = strtoupper($paymentMethod);
        if (!in_array($paymentMethod, ['COD', 'MOMO'], true)) {
            throw ValidationException::withMessages(['payment_method' => ['Phương thức thanh toán không hợp lệ.']]);
        }

        if ($order->payment->payment_method === $paymentMethod) {
            throw ValidationException::withMessages(['payment_method' => ['Đơn hàng đang sử dụng phương thức này.']]);
        }

        $order->payment->update([
            'payment_method' => $paymentMethod,
            'status' => 0,
            'paid_at' => null,
            'transaction_code' => 'PAY' . now()->format('YmdHis') . random_int(1000, 9999),
        ]);
        $order->subOrders()->update(['payment_status' => 0]);

        $momo = $paymentMethod === 'MOMO'
            ? $this->momoPaymentService->createPayment($order->fresh('payment'))
            : [];

        return [
            'order' => $this->getBuyerOrder($userId, $orderId),
            'payment_url' => $momo['payment_url'] ?? null,
            'deeplink' => $momo['deeplink'] ?? null,
            'qr_code_url' => $momo['qr_code_url'] ?? null,
        ];
    }

    private function ensurePaymentMethodCanChange(Order $order): void
    {
        if (!$order->payment) {
            throw ValidationException::withMessages(['payment' => ['Đơn hàng chưa có thông tin thanh toán.']]);
        }
        if ((int) $order->payment->status === 1) {
            throw ValidationException::withMessages(['payment' => ['Thanh toán online đã thành công nên không thể đổi phương thức.']]);
        }
        if ((int) $order->status !== 0 || $order->subOrders->contains(fn ($subOrder) => (int) $subOrder->status !== 0)) {
            throw ValidationException::withMessages(['order' => ['Chỉ được đổi phương thức khi toàn bộ đơn vẫn chờ xác nhận.']]);
        }
    }

    /**
     * Danh sách đơn hàng của buyer
     */
    public function getBuyerOrders(int $userId, array $filters = []): array
    {
        $query = Order::with([
            'payment',
            'subOrders.farm',
            'subOrders.items.product.farm',
            'subOrders.items.product.approvedCertificate',
            'cancelledBy',
            'subOrders.cancelledBy',
        ])
            ->where('user_id', $userId);

        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where('order_code', 'like', "%{$keyword}%")
                    ->orWhere('shipping_name', 'like', "%{$keyword}%")
                    ->orWhere('shipping_phone', 'like', "%{$keyword}%")
                    ->orWhereHas('subOrders', function ($subQuery) use ($keyword) {
                        $subQuery->where('sub_order_code', 'like', "%{$keyword}%");
                    });
            });
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', (int) $filters['status']);
        }

        if (isset($filters['payment_status']) && $filters['payment_status'] !== '') {
            $query->whereHas('payment', function ($q) use ($filters) {
                $q->where('status', (int) $filters['payment_status']);
            });
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $perPage = (int) ($filters['per_page'] ?? 10);
        $perPage = max(5, min($perPage, 50));

        $paginator = $query
            ->latest()
            ->paginate($perPage);

        return [
            'stats' => $this->getStats($userId),

            'orders' => $paginator->getCollection()
                ->map(fn ($order) => $this->formatOrder($order))
                ->values(),

            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ];
    }

    /**
     * Chi tiết đơn hàng của buyer
     */
    public function getBuyerOrder(int $userId, int $orderId): array
    {
        $order = Order::with([
            'address',
            'payment',
            'subOrders.farm',
            'subOrders.items.product.farm',
            'subOrders.items.product.approvedCertificate',
            'subOrders.items.orderItemLots.harvestLot',
        ])
            ->where('id', $orderId)
            ->where('user_id', $userId)
            ->first();

        if (!$order) {
            throw ValidationException::withMessages([
                'order' => ['Đơn hàng không tồn tại hoặc không thuộc về bạn.'],
            ]);
        }

        return $this->formatOrderDetail($order);
    }

    /**
     * Buyer hủy toàn bộ order
     */
    public function cancelBuyerOrder(
        int $userId,
        int $orderId,
        ?string $cancelReason = null
    ): array {
        return DB::transaction(function () use (
            $userId,
            $orderId,
            $cancelReason
        ) {
            $order = Order::with([
                'payment',
                'subOrders.items.orderItemLots',
            ])
                ->where('id', $orderId)
                ->where('user_id', $userId)
                ->lockForUpdate()
                ->first();

            if (!$order) {
                throw ValidationException::withMessages([
                    'order' => ['Đơn hàng không tồn tại hoặc không thuộc về bạn.'],
                ]);
            }

            if ((int) $order->status === 4) {
                throw ValidationException::withMessages([
                    'order' => ['Đơn hàng đã được hủy trước đó.'],
                ]);
            }

            $this->validateCanCancel($order);

            foreach ($order->subOrders as $subOrder) {
                if (in_array((int) $subOrder->status, [0, 1], true)) {
                    foreach ($subOrder->items as $orderItem) {
                        $this->inventoryService->restoreLots($orderItem);
                    }

                    $subOrder->update([
                        'status' => 4,
                        'payment_status' => ((int) $subOrder->payment_status === 1) ? 3 : 2,
                        'seller_note' => $cancelReason ?? $subOrder->seller_note,
                        'cancelled_by' => $userId,
                        'cancelled_at' => now(),
                        'cancel_reason' => $cancelReason,
                    ]);
                }
            }

            $order->update([
                'status' => 4,
                'cancelled_by' => $userId,
                'cancelled_at' => now(),
                'cancel_reason' => $cancelReason,
            ]);

            if ($order->payment) {
                $order->payment->update([
                    'status' => ((int) $order->payment->status === 1) ? 3 : 2,
                ]);
            }

            return $this->getBuyerOrder(
                userId: $userId,
                orderId: $order->id,
            );
        });
    }

    /**
     * Kiểm tra buyer có được hủy không
     */
    private function validateCanCancel(Order $order): void
    {
        $isPaidMomo = strtolower((string) $order->payment?->payment_method) === 'momo'
            && (int) $order->payment?->status === 1;

        if ($isPaidMomo) {
            throw ValidationException::withMessages([
                'payment' => [
                    'Đơn MoMo đã thanh toán không thể hủy trực tiếp. Vui lòng gửi yêu cầu hoàn tiền để quản trị viên xử lý với cổng thanh toán.'
                ],
            ]);
        }

        $statuses = $order->subOrders
            ->pluck('status')
            ->map(fn ($status) => (int) $status);

        if ($statuses->contains(2)) {
            throw ValidationException::withMessages([
                'order' => ['Đơn hàng đang giao, không thể hủy.'],
            ]);
        }

        if ($statuses->contains(3)) {
            throw ValidationException::withMessages([
                'order' => ['Đơn hàng đã hoàn thành, không thể hủy.'],
            ]);
        }

        if ($statuses->every(fn ($status) => $status === 4)) {
            throw ValidationException::withMessages([
                'order' => ['Đơn hàng đã được hủy trước đó.'],
            ]);
        }
    }

    /**
     * Thống kê nhanh đơn hàng buyer
     */
    private function getStats(int $userId): array
    {
        $query = Order::where('user_id', $userId);

        return [
            'total_orders' => (clone $query)->count(),

            'pending_orders' => (clone $query)
                ->where('status', 0)
                ->count(),

            'processing_orders' => (clone $query)
                ->where('status', 1)
                ->count(),

            'shipping_orders' => (clone $query)
                ->where('status', 2)
                ->count(),

            'completed_orders' => (clone $query)
                ->where('status', 3)
                ->count(),

            'cancelled_orders' => (clone $query)
                ->where('status', 4)
                ->count(),

            'total_spent' => (clone $query)
                ->where('status', 3)
                ->sum('grand_total'),
        ];
    }

    /**
     * Format order list
     */
    private function formatOrder(Order $order): array
    {
        $order->loadMissing([
            'payment',
            'subOrders.farm',
            'subOrders.items.product.farm',
            'subOrders.items.product.approvedCertificate',
        ]);

        return [
            'id' => $order->id,
            'order_code' => $order->order_code,

            'shipping_name' => $order->shipping_name,
            'shipping_phone' => $order->shipping_phone,
            'shipping_address' => $order->shipping_address,

            'items_total' => (float) $order->items_total,
            'shipping_fee' => (float) $order->shipping_fee,
            'grand_total' => (float) $order->grand_total,

            'status' => (int) $order->status,
            'status_text' => $this->getOrderStatusText((int) $order->status),
            'status_class' => $this->getOrderStatusClass((int) $order->status),
            'cancellation' => $order->cancelled_at ? [
                'reason' => $order->cancel_reason,
                'at' => optional($order->cancelled_at)->format('d/m/Y H:i'),
                'by' => $order->cancelledBy ? ['id' => $order->cancelledBy->id, 'name' => $order->cancelledBy->name] : null,
            ] : null,

            'payment_method' => $order->payment?->payment_method,
            'payment_status' => (int) ($order->payment?->status ?? 0),
            'payment_status_text' => $this->getPaymentStatusText(
                (int) ($order->payment?->status ?? 0)
            ),

            'sub_orders_count' => $order->subOrders->count(),

            'items_count' => $order->subOrders
                ->sum(fn ($subOrder) => $subOrder->items->count()),

            'items_quantity' => (float) $order->subOrders
                ->flatMap(fn ($subOrder) => $subOrder->items)
                ->sum(fn ($item) => (float) $item->quantity),

            'sub_orders' => $order->subOrders
                ->map(fn ($subOrder) => $this->formatSubOrder($subOrder))
                ->values(),

            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
        ];
    }

    /**
     * Format order detail
     */
    private function formatOrderDetail(Order $order): array
    {
        $data = $this->formatOrder($order);

        $data['address'] = $order->address ? [
            'id' => $order->address->id,
            'receiver_name' => $order->address->receiver_name,
            'phone' => $order->address->phone,
            'address_line' => $order->address->address_line,
            'ward' => $order->address->ward,
            'district' => $order->address->district,
            'province' => $order->address->province,
        ] : null;

        $data['payment'] = $order->payment ? [
            'id' => $order->payment->id,
            'transaction_code' => $order->payment->transaction_code,
            'payment_method' => $order->payment->payment_method,
            'amount' => (float) $order->payment->amount,
            'status' => (int) $order->payment->status,
            'status_text' => $this->getPaymentStatusText((int) $order->payment->status),
            'paid_at' => $order->payment->paid_at,
        ] : null;

        $data['sub_orders'] = $order->subOrders
            ->map(function ($subOrder) {
                $subOrderData = $this->formatSubOrder($subOrder);

                $subOrderData['items'] = $subOrder->items
                    ->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'product_id' => $item->product_id,
                            'product_name' => $item->product_name,
                            'product_image' => $item->product_image,
                            'unit' => $item->unit,
                            'quantity' => (float) $item->quantity,
                            'price' => (float) $item->price,
                            'subtotal' => (float) $item->subtotal,

                            'product' => $this->formatProductReference($item->product),

                            'allocated_lots' => $item->orderItemLots
                                ->map(function ($itemLot) {
                                    return [
                                        'harvest_lot_id' => $itemLot->harvest_lot_id,
                                        'lot_code' => $itemLot->harvestLot?->lot_code,
                                        'quantity' => (float) $itemLot->quantity,
                                    ];
                                })
                                ->values(),
                        ];
                    })
                    ->values();

                return $subOrderData;
            })
            ->values();

        return $data;
    }

    /**
     * Format sub order
     */
    private function formatSubOrder(SubOrder $subOrder): array
    {
        $subOrder->loadMissing([
            'farm',
            'items.product.farm',
            'items.product.approvedCertificate',
            'cancelledBy',
        ]);

        return [
            'id' => $subOrder->id,
            'sub_order_code' => $subOrder->sub_order_code,

            'farm_id' => $subOrder->farm_id,
            'farm_name' => $subOrder->farm?->name,
            'farm' => $subOrder->farm ? [
                'id' => $subOrder->farm->id,
                'name' => $subOrder->farm->name,
                'slug' => $subOrder->farm->slug,
                'status' => (int) $subOrder->farm->status,
                'is_publicly_visible' =>
                    (int) $subOrder->farm->status === Farm::STATUS_ACTIVE,
            ] : null,

            'items_total' => (float) $subOrder->items_total,
            'shipping_fee' => (float) $subOrder->shipping_fee,
            'total' => (float) $subOrder->total,

            'status' => (int) $subOrder->status,
            'status_text' => $this->getSubOrderStatusText((int) $subOrder->status),
            'status_class' => $this->getOrderStatusClass((int) $subOrder->status),
            'cancellation' => $subOrder->cancelled_at ? [
                'reason' => $subOrder->cancel_reason,
                'at' => optional($subOrder->cancelled_at)->format('d/m/Y H:i'),
                'by' => $subOrder->cancelledBy ? ['id' => $subOrder->cancelledBy->id, 'name' => $subOrder->cancelledBy->name] : null,
            ] : null,

            'payment_status' => (int) $subOrder->payment_status,
            'payment_status_text' => $this->getPaymentStatusText((int) $subOrder->payment_status),

            'seller_note' => $subOrder->seller_note,

            'items_count' => $subOrder->items->count(),

            'items_quantity' => (float) $subOrder->items->sum(function ($item) {
                return (float) $item->quantity;
            }),

            'items' => $subOrder->items
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product_name,
                        'product_image' => $item->product_image,
                        'unit' => $item->unit,
                        'quantity' => (float) $item->quantity,
                        'price' => (float) $item->price,
                        'subtotal' => (float) $item->subtotal,
                        'product' => $this->formatProductReference($item->product),
                    ];
                })
                ->values(),
        ];
    }

    private function formatProductReference(?Product $product): ?array
    {
        if (!$product) {
            return null;
        }

        $farm = $product->farm;
        $isPubliclyVisible = (int) $product->status === 1
            && $farm
            && (int) $farm->status === Farm::STATUS_ACTIVE
            && $product->approvedCertificate !== null;

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'thumbnail' => $product->thumbnail,
            'status' => (int) $product->status,
            'is_publicly_visible' => (bool) $isPubliclyVisible,
        ];
    }

    private function getOrderStatusText(int $status): string
    {
        return match ($status) {
            0 => 'Chờ xác nhận',
            1 => 'Đang xử lý',
            2 => 'Đang giao',
            3 => 'Hoàn thành',
            4 => 'Đã hủy',
            default => 'Không xác định',
        };
    }

    private function getSubOrderStatusText(int $status): string
    {
        return match ($status) {
            0 => 'Chờ xác nhận',
            1 => 'Đang chuẩn bị',
            2 => 'Đang giao',
            3 => 'Hoàn thành',
            4 => 'Đã hủy',
            default => 'Không xác định',
        };
    }

    private function getOrderStatusClass(int $status): string
    {
        return match ($status) {
            0 => 'warning',
            1 => 'info',
            2 => 'primary',
            3 => 'success',
            4 => 'danger',
            default => 'secondary',
        };
    }

    private function getPaymentStatusText(int $status): string
    {
        return match ($status) {
            0 => 'Chờ thanh toán',
            1 => 'Đã thanh toán',
            2 => 'Thanh toán thất bại',
            3 => 'Đã hoàn tiền',
            default => 'Không xác định',
        };
    }
}
