<?php

namespace App\Services\Order;

use App\Models\Farm;
use App\Models\Order;
use App\Models\SubOrder;
use App\Services\Revenue\RevenueMetricsService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class SellerOrderService
{
    public function __construct(
        private InventoryService $inventoryService,
        private RevenueMetricsService $revenueMetrics,
        private OrderAggregateService $orderAggregateService,
    ) {
    }

    /**
     * Danh sách đơn hàng của seller
     */
    public function getVendorOrders(int $sellerId, array $filters = []): array
    {
        $farm = $this->getSellerFarm($sellerId);

        $query = SubOrder::with([
            'order.user',
            'order.payment',
            'farm',
            'items',
            'cancelledBy',
        ])
            ->where('farm_id', $farm->id);

        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where('sub_order_code', 'like', "%{$keyword}%")
                    ->orWhereHas('order', function ($orderQuery) use ($keyword) {
                        $orderQuery->where('order_code', 'like', "%{$keyword}%")
                            ->orWhere('shipping_name', 'like', "%{$keyword}%")
                            ->orWhere('shipping_phone', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('items', function ($itemQuery) use ($keyword) {
                        $itemQuery->where('product_name', 'like', "%{$keyword}%");
                    });
            });
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', (int) $filters['status']);
        }

        if (isset($filters['payment_status']) && $filters['payment_status'] !== '') {
            $query->where('payment_status', (int) $filters['payment_status']);
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
            'farm' => [
                'id' => $farm->id,
                'name' => $farm->name,
            ],

            'stats' => $this->getStats($farm->id),

            'orders' => $paginator->getCollection()
                ->map(fn ($subOrder) => $this->formatOrder($subOrder))
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
     * Chi tiết đơn hàng của seller
     */
    public function getVendorOrder(int $sellerId, int $subOrderId): array
    {
        $farm = $this->getSellerFarm($sellerId);

        $subOrder = SubOrder::with([
            'order.user',
            'order.address',
            'order.payment',
            'farm',
            'items.product.approvedCertificate',
            'items.product.farm',
            'items.orderItemLots.harvestLot',
        ])
            ->where('id', $subOrderId)
            ->where('farm_id', $farm->id)
            ->first();

        if (!$subOrder) {
            throw ValidationException::withMessages([
                'order' => ['Đơn hàng không tồn tại hoặc không thuộc trang trại của bạn.'],
            ]);
        }

        return $this->formatOrderDetail($subOrder);
    }

    /**
     * Seller cập nhật trạng thái đơn hàng
     */
    public function updateVendorOrderStatus(
        int $sellerId,
        int $subOrderId,
        int $newStatus,
        ?string $sellerNote = null
    ): array {
        $farm = $this->getSellerFarm($sellerId);

        return DB::transaction(function () use (
            $farm,
            $sellerId,
            $subOrderId,
            $newStatus,
            $sellerNote
        ) {
                $subOrder = SubOrder::with([
                    'order.subOrders',
                    'order.payment',
                    'items.orderItemLots',
                ])
                ->where('id', $subOrderId)
                ->where('farm_id', $farm->id)
                ->lockForUpdate()
                ->first();

            if (!$subOrder) {
                throw ValidationException::withMessages([
                    'order' => ['Đơn hàng không tồn tại hoặc không thuộc trang trại của bạn.'],
                ]);
            }

            $this->validateStatusTransition(
                currentStatus: (int) $subOrder->status,
                newStatus: $newStatus
            );
            $this->ensureMomoPaymentAllowsTransition(
                subOrder: $subOrder,
                newStatus: $newStatus
            );

            /*
            |--------------------------------------------------------------------------
            | Nếu seller hủy đơn thì hoàn lại tồn kho FIFO
            |--------------------------------------------------------------------------
            */
            if ($newStatus === 4) {
                foreach ($subOrder->items as $orderItem) {
                    $this->inventoryService->restoreLots($orderItem);
                }
                $subOrder->cancelled_by = $sellerId;
                $subOrder->cancelled_at = now();
                $subOrder->cancel_reason = $sellerNote;
            }

            $subOrder->status = $newStatus;

            if ($sellerNote !== null) {
                $subOrder->seller_note = $sellerNote;
            }

            /*
            |--------------------------------------------------------------------------
            | Cập nhật payment_status của SubOrder
            |--------------------------------------------------------------------------
            */
            if ($newStatus === 3) {
                // COD được ghi nhận đã thu tiền khi giao hoàn tất.
                // MoMo chỉ đi tới đây sau khi callback đã xác nhận thanh toán.
                $subOrder->payment_status = 1;

                if (Schema::hasColumn('sub_orders', 'completed_at')) {
                    $subOrder->completed_at ??= now();
                }
            }

            if ($newStatus === 4) {
                // Đơn đã thanh toán bị chặn từ trước; hủy ở đây luôn là chưa thanh toán.
                $subOrder->payment_status = 2;
            }

            $subOrder->save();

            if ($newStatus === 4) {
                $this->orderAggregateService->syncAmounts($subOrder->order);
            }

            $this->syncParentOrderStatus($subOrder->order);
            $this->syncParentPaymentStatus($subOrder->order);

            return $this->getVendorOrder(
                sellerId: $farm->seller_id,
                subOrderId: $subOrder->id
            );
        });
    }

    /**
     * Lấy farm của seller
     */
    private function getSellerFarm(int $sellerId): Farm
    {
        $farm = Farm::where('seller_id', $sellerId)->first();

        if (!$farm) {
            throw ValidationException::withMessages([
                'farm' => ['Bạn chưa có trang trại.'],
            ]);
        }

        return $farm;
    }

    /**
     * Thống kê nhanh đơn hàng
     */
    private function getStats(int $farmId): array
    {
        $query = SubOrder::where('farm_id', $farmId);
        $monthRevenueTotals = $this->revenueMetrics->totals(
            $farmId,
            now()->startOfMonth(),
            now()->endOfMonth()
        );

        return [
            'total_orders' => (clone $query)->count(),

            'pending_orders' => (clone $query)
                ->where('status', 0)
                ->count(),

            'preparing_orders' => (clone $query)
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

            'today_orders' => (clone $query)
                ->whereDate('created_at', today())
                ->count(),

            'month_revenue' => $monthRevenueTotals['total_revenue'],
            'month_items_revenue' => $monthRevenueTotals['items_revenue'],
            'month_shipping_revenue' => $monthRevenueTotals['shipping_revenue'],
        ];
    }

    /**
     * Kiểm tra luồng trạng thái hợp lệ
     */
    private function validateStatusTransition(
        int $currentStatus,
        int $newStatus
    ): void {
        if ($currentStatus === $newStatus) {
            throw ValidationException::withMessages([
                'status' => ['Đơn hàng đã ở trạng thái này.'],
            ]);
        }

        $allowedTransitions = [
            0 => [1, 4], // Chờ xác nhận -> Chuẩn bị hoặc Hủy
            1 => [2, 4], // Chuẩn bị -> Giao hàng hoặc Hủy
            2 => [3],    // Đang giao -> Hoàn thành
            3 => [],     // Hoàn thành -> không đổi
            4 => [],     // Đã hủy -> không đổi
        ];

        if (!in_array($newStatus, $allowedTransitions[$currentStatus] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => [
                    'Không thể chuyển trạng thái từ "'
                    . $this->getStatusText($currentStatus)
                    . '" sang "'
                    . $this->getStatusText($newStatus)
                    . '".'
                ],
            ]);
        }
    }


    private function ensureMomoPaymentAllowsTransition(
        SubOrder $subOrder,
        int $newStatus
    ): void {
        $subOrder->loadMissing('order.payment');

        $payment = $subOrder->order?->payment;

        if (strtoupper((string) $payment?->payment_method) !== 'MOMO') {
            return;
        }

        $isPaid = (int) ($payment?->status ?? 0) === 1;

        if (!$isPaid && in_array($newStatus, [1, 2, 3], true)) {
            throw ValidationException::withMessages([
                'payment' => [
                    'Đơn MoMo chưa thanh toán thành công nên chưa thể chuẩn bị, giao hoặc hoàn thành.',
                ],
            ]);
        }

        if ($isPaid && $newStatus === 4) {
            throw ValidationException::withMessages([
                'status' => [
                    'Không thể hủy đơn MoMo đã thanh toán. Vui lòng xử lý hoàn tiền trước.',
                ],
            ]);
        }
    }

    /**
     * Đồng bộ trạng thái Order cha
     */
    private function syncParentOrderStatus(Order $order): void
    {
        $order->load('subOrders');

        $statuses = $order->subOrders
            ->pluck('status')
            ->map(fn ($status) => (int) $status);

        if ($statuses->every(fn ($status) => $status === 4)) {
            $orderStatus = 4; // Tất cả sub-order bị hủy
        } elseif (
            $statuses->every(fn ($status) => in_array($status, [3, 4], true))
            && $statuses->contains(3)
        ) {
            $orderStatus = 3; // Các đơn còn lại đã hoàn thành
        } elseif ($statuses->contains(2)) {
            $orderStatus = 2; // Có đơn đang giao
        } elseif ($statuses->contains(1)) {
            $orderStatus = 1; // Có đơn đang xử lý
        } else {
            $orderStatus = 0; // Chờ xác nhận
        }

        $order->update([
            'status' => $orderStatus,
        ]);
    }

    /**
     * Format danh sách đơn
     */
    private function formatOrder(SubOrder $subOrder): array
    {
        $subOrder->loadMissing([
            'order.user',
            'order.payment',
            'farm',
            'items',
        ]);

        return [
            'id' => $subOrder->id,
            'sub_order_code' => $subOrder->sub_order_code,

            'order_id' => $subOrder->order_id,
            'order_code' => $subOrder->order?->order_code,

            'farm_id' => $subOrder->farm_id,
            'farm_name' => $subOrder->farm?->name,

            'customer_name' => $subOrder->order?->shipping_name,
            'customer_phone' => $subOrder->order?->shipping_phone,
            'shipping_address' => $subOrder->order?->shipping_address,

            'items_count' => $subOrder->items->count(),
            'items_quantity' => (float) $subOrder->items
                ->sum(fn ($item) => (float) $item->quantity),

            'items_total' => (float) $subOrder->items_total,
            'shipping_fee' => (float) $subOrder->shipping_fee,
            'total' => (float) $subOrder->total,

            'status' => (int) $subOrder->status,
            'status_text' => $this->getStatusText((int) $subOrder->status),
            'status_class' => $this->getStatusClass((int) $subOrder->status),
            'cancellation' => $subOrder->cancelled_at ? [
                'reason' => $subOrder->cancel_reason,
                'at' => optional($subOrder->cancelled_at)->format('d/m/Y H:i'),
                'by' => $subOrder->cancelledBy ? ['id' => $subOrder->cancelledBy->id, 'name' => $subOrder->cancelledBy->name] : null,
            ] : null,
            
            'payment_method' => $subOrder->order?->payment?->payment_method,
            'payment_status' => (int) $subOrder->payment_status,
            'payment_status_text' => $this->getPaymentStatusText((int) $subOrder->payment_status),

            'seller_note' => $subOrder->seller_note,

            'created_at' => $subOrder->created_at,
            'updated_at' => $subOrder->updated_at,
        ];
    }

    /**
     * Format chi tiết đơn
     */
    private function formatOrderDetail(SubOrder $subOrder): array
    {
        $data = $this->formatOrder($subOrder);

        $data['order'] = [
            'id' => $subOrder->order?->id,
            'order_code' => $subOrder->order?->order_code,
            'status' => $subOrder->order?->status,
            'grand_total' => (float) ($subOrder->order?->grand_total ?? 0),
            'payment_method' => $subOrder->order?->payment?->payment_method,
            'payment_status' => $subOrder->order?->payment?->status,
        ];

        $data['items'] = $subOrder->items
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
                        'slug' => $item->product->slug,
                        'thumbnail' => $item->product->thumbnail,
                        'status' => (int) $item->product->status,
                        'is_publicly_visible' => $item->product->isPubliclyVisible(),
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

        return $data;
    }

    private function getStatusText(int $status): string
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

    private function getStatusClass(int $status): string
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

    /**
     * Đồng bộ trạng thái thanh toán của Order cha.
     */
    private function syncParentPaymentStatus(Order $order): void
    {
        // Luôn đọc lại trực tiếp từ database để tránh dùng collection subOrders
        // đã được eager-load trước khi đơn con hiện tại đổi trạng thái.
        $payment = $order->payment()->first();

        if (!$payment) {
            return;
        }

        $subOrders = $order->subOrders()
            ->select(['status', 'payment_status'])
            ->get();

        if ($subOrders->isEmpty()) {
            return;
        }

        $allCancelled = $subOrders->every(
            fn (SubOrder $subOrder) => (int) $subOrder->status === 4
        );

        if ($allCancelled) {
            if ((int) $payment->status !== 1) {
                $payment->update(['status' => 2]);
            }

            return;
        }

        // MoMo chỉ được đổi sang Đã thanh toán từ callback của cổng MoMo.
        if (strtoupper((string) $payment->payment_method) === 'MOMO') {
            return;
        }

        $activeSubOrders = $subOrders->reject(
            fn (SubOrder $subOrder) => (int) $subOrder->status === 4
        );

        // COD: tất cả đơn con còn hiệu lực phải Hoàn thành và đã ghi nhận thu tiền.
        $allActiveCompletedAndPaid = $activeSubOrders->isNotEmpty()
            && $activeSubOrders->every(
                fn (SubOrder $subOrder) => (int) $subOrder->status === 3
                    && (int) $subOrder->payment_status === 1
            );

        if ($allActiveCompletedAndPaid) {
            $payment->update([
                'status' => 1,
                'paid_at' => $payment->paid_at ?? now(),
            ]);
        }
    }
}
