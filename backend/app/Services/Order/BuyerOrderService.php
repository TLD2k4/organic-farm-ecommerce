<?php

namespace App\Services\Order;

use App\Models\Order;
use App\Models\SubOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BuyerOrderService
{
    public function __construct(
        private InventoryService $inventoryService,
    ) {
    }

    /**
     * Danh sách đơn hàng của buyer
     */
    public function getBuyerOrders(int $userId, array $filters = []): array
    {
        $query = Order::with([
            'payment',
            'subOrders.farm',
            'subOrders.items',
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
            'subOrders.items.product',
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
                    ]);
                }
            }

            $order->update([
                'status' => 4,
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
            'subOrders.items',
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

                            'product' => $item->product ? [
                                'id' => $item->product->id,
                                'name' => $item->product->name,
                                'thumbnail' => $item->product->thumbnail,
                                'status' => (int) $item->product->status,
                            ] : null,

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
            'items',
        ]);

        return [
            'id' => $subOrder->id,
            'sub_order_code' => $subOrder->sub_order_code,

            'farm_id' => $subOrder->farm_id,
            'farm_name' => $subOrder->farm?->name,

            'items_total' => (float) $subOrder->items_total,
            'shipping_fee' => (float) $subOrder->shipping_fee,
            'total' => (float) $subOrder->total,

            'status' => (int) $subOrder->status,
            'status_text' => $this->getSubOrderStatusText((int) $subOrder->status),
            'status_class' => $this->getOrderStatusClass((int) $subOrder->status),

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
                    ];
                })
                ->values(),
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