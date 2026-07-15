<?php

namespace App\Services\Order;

use App\Models\Farm;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\SubOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminOrderService
{
    public function __construct(
        private InventoryService $inventoryService,
    ) {}

    public function getOptions(): array
    {
        return [
            'farms' => Farm::withTrashed()
                ->with(['seller' => fn ($query) => $query->withTrashed()])
                ->orderBy('name')
                ->get()
                ->map(fn (Farm $farm) => [
                    'id' => $farm->id,
                    'name' => $farm->name,
                    'slug' => $farm->slug,
                    'status' => (int) $farm->status,
                    'deleted_at' => $farm->deleted_at,
                    'seller' => $farm->seller ? [
                        'id' => $farm->seller->id,
                        'name' => $farm->seller->name,
                        'email' => $farm->seller->email,
                    ] : null,
                ])
                ->values(),
        ];
    }

    public function getOrders(array $filters): array
    {
        $query = Order::withTrashed()
            ->with([
                'user' => fn ($query) => $query->withTrashed(),
                'payment' => fn ($query) => $query->withTrashed(),
                'subOrders' => fn ($query) => $query->withTrashed()
                    ->with([
                        'farm' => fn ($farmQuery) => $farmQuery->withTrashed(),
                        'items',
                    ]),
            ]);

        $this->applyOrderFilters($query, $filters);

        $perPage = max(5, min((int) ($filters['per_page'] ?? 10), 50));
        $paginator = $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage);

        return [
            'stats' => $this->getOrderStats(),
            'orders' => $paginator->getCollection()
                ->map(fn (Order $order) => $this->formatOrder($order))
                ->values(),
            'meta' => $this->formatMeta($paginator),
        ];
    }

    public function getOrderDetail(int $orderId): array
    {
        $order = Order::withTrashed()
            ->with([
                'user' => fn ($query) => $query->withTrashed(),
                'address' => fn ($query) => $query->withTrashed(),
                'payment' => fn ($query) => $query->withTrashed(),
                'subOrders' => fn ($query) => $query->withTrashed()
                    ->with($this->subOrderDetailRelations()),
            ])
            ->findOrFail($orderId);

        return $this->formatOrder($order, true);
    }

    public function getSubOrders(array $filters): array
    {
        $query = SubOrder::withTrashed()
            ->with([
                'order' => fn ($query) => $query->withTrashed()
                    ->with([
                        'user' => fn ($userQuery) => $userQuery->withTrashed(),
                        'payment' => fn ($paymentQuery) => $paymentQuery->withTrashed(),
                    ]),
                'farm' => fn ($query) => $query->withTrashed()
                    ->with(['seller' => fn ($sellerQuery) => $sellerQuery->withTrashed()]),
                'items',
            ]);

        $this->applySubOrderFilters($query, $filters);

        $perPage = max(5, min((int) ($filters['per_page'] ?? 10), 50));
        $paginator = $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage);

        return [
            'stats' => $this->getSubOrderStats(),
            'sub_orders' => $paginator->getCollection()
                ->map(fn (SubOrder $subOrder) => $this->formatSubOrder($subOrder))
                ->values(),
            'meta' => $this->formatMeta($paginator),
        ];
    }

    public function getSubOrderDetail(int $subOrderId): array
    {
        $subOrder = SubOrder::withTrashed()
            ->with($this->subOrderDetailRelations())
            ->findOrFail($subOrderId);

        return $this->formatSubOrder($subOrder, true);
    }

    public function updateSubOrderStatus(
        int $subOrderId,
        int $newStatus,
    ): array {
        return DB::transaction(function () use (
            $subOrderId,
            $newStatus,
        ) {
            $subOrder = SubOrder::query()
                ->with([
                    'order' => fn ($query) => $query->withTrashed()
                        ->with([
                            'subOrders',
                            'payment' => fn ($paymentQuery) => $paymentQuery->withTrashed(),
                        ]),
                    'items.orderItemLots',
                ])
                ->lockForUpdate()
                ->findOrFail($subOrderId);

            $currentStatus = (int) $subOrder->status;

            $this->validateStatusTransition($currentStatus, $newStatus);
            $this->ensureCanCancelPaidMomoOrder($subOrder, $newStatus);

            if ($newStatus === 4) {
                foreach ($subOrder->items as $orderItem) {
                    $this->inventoryService->restoreLots($orderItem);
                }
            }

            $subOrder->status = $newStatus;

            if ($newStatus === 3) {
                $subOrder->payment_status = 1;
            }

            if ($newStatus === 4) {
                $subOrder->payment_status = (int) $subOrder->payment_status === 1
                    ? 3
                    : 2;
            }

            $subOrder->save();

            $this->syncParentOrderStatus($subOrder->order);
            $this->syncParentPaymentStatus($subOrder->order);

            return $this->getSubOrderDetail($subOrder->id);
        });
    }

    public function cancelParentOrder(int $orderId, string $reason, int $actorId): array
    {
        return DB::transaction(function () use ($orderId, $reason, $actorId) {
            $order = Order::query()
                ->with([
                    'payment',
                    'subOrders.items.orderItemLots',
                ])
                ->lockForUpdate()
                ->findOrFail($orderId);

            if (!in_array((int) $order->status, [0, 1], true)) {
                throw ValidationException::withMessages([
                    'order' => [
                        'Chỉ được hủy toàn bộ đơn cha khi đơn còn chờ xác nhận hoặc đang xử lý.',
                    ],
                ]);
            }

            if ($order->subOrders->contains(
                fn (SubOrder $subOrder) => in_array((int) $subOrder->status, [2, 3], true)
            )) {
                throw ValidationException::withMessages([
                    'order' => ['Không thể hủy toàn bộ vì có đơn con đang giao hoặc đã hoàn thành.'],
                ]);
            }

            if ((int) ($order->payment?->status ?? 0) === 1) {
                throw ValidationException::withMessages([
                    'payment' => [
                        'Không thể hủy đơn đã thanh toán khi chưa thực hiện hoàn tiền.',
                    ],
                ]);
            }

            foreach ($order->subOrders as $subOrder) {
                if ((int) $subOrder->status === 4) {
                    continue;
                }

                foreach ($subOrder->items as $orderItem) {
                    $this->inventoryService->restoreLots($orderItem);
                }

                $subOrder->update([
                    'status' => 4,
                    'payment_status' => 2,
                    'seller_note' => trim($reason),
                    'cancelled_by' => $actorId,
                    'cancelled_at' => now(),
                    'cancel_reason' => trim($reason),
                ]);
            }

            $order->update(['status' => 4, 'cancelled_by' => $actorId, 'cancelled_at' => now(), 'cancel_reason' => trim($reason)]);
            $order->payment?->update(['status' => 2]);

            return $this->getOrderDetail($order->id);
        });
    }

    private function applyOrderFilters(Builder $query, array $filters): void
    {
        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);

            $query->where(function (Builder $subQuery) use ($keyword) {
                $subQuery
                    ->where('order_code', 'like', "%{$keyword}%")
                    ->orWhere('shipping_name', 'like', "%{$keyword}%")
                    ->orWhere('shipping_phone', 'like', "%{$keyword}%")
                    ->orWhere('shipping_address', 'like', "%{$keyword}%")
                    ->orWhereHas('user', function (Builder $userQuery) use ($keyword) {
                        $userQuery
                            ->where('name', 'like', "%{$keyword}%")
                            ->orWhere('email', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('subOrders', function (Builder $subOrderQuery) use ($keyword) {
                        $subOrderQuery
                            ->withTrashed()
                            ->where(function (Builder $nestedQuery) use ($keyword) {
                                $nestedQuery
                                    ->where('sub_order_code', 'like', "%{$keyword}%")
                                    ->orWhereHas('farm', function (Builder $farmQuery) use ($keyword) {
                                        $farmQuery->withTrashed()
                                            ->where('name', 'like', "%{$keyword}%");
                                    });
                            });
                    })
                    ->orWhereHas('payment', function (Builder $paymentQuery) use ($keyword) {
                        $paymentQuery->withTrashed()
                            ->where('transaction_code', 'like', "%{$keyword}%");
                    });
            });
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', (int) $filters['status']);
        }

        if (isset($filters['payment_status']) && $filters['payment_status'] !== '') {
            $query->whereHas('payment', function (Builder $paymentQuery) use ($filters) {
                $paymentQuery->withTrashed()
                    ->where('status', (int) $filters['payment_status']);
            });
        }

        if (!empty($filters['payment_method'])) {
            $query->whereHas('payment', function (Builder $paymentQuery) use ($filters) {
                $paymentQuery->withTrashed()
                    ->where('payment_method', $filters['payment_method']);
            });
        }

        $this->applyDateAndDeletedFilters($query, $filters);
    }

    private function applySubOrderFilters(Builder $query, array $filters): void
    {
        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);

            $query->where(function (Builder $subQuery) use ($keyword) {
                $subQuery
                    ->where('sub_order_code', 'like', "%{$keyword}%")
                    ->orWhereHas('order', function (Builder $orderQuery) use ($keyword) {
                        $orderQuery->withTrashed()
                            ->where(function (Builder $nestedQuery) use ($keyword) {
                                $nestedQuery
                                    ->where('order_code', 'like', "%{$keyword}%")
                                    ->orWhere('shipping_name', 'like', "%{$keyword}%")
                                    ->orWhere('shipping_phone', 'like', "%{$keyword}%");
                            });
                    })
                    ->orWhereHas('farm', function (Builder $farmQuery) use ($keyword) {
                        $farmQuery->withTrashed()
                            ->where('name', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('items', function (Builder $itemQuery) use ($keyword) {
                        $itemQuery->where('product_name', 'like', "%{$keyword}%");
                    });
            });
        }

        if (!empty($filters['farm_id'])) {
            $query->where('farm_id', (int) $filters['farm_id']);
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', (int) $filters['status']);
        }

        if (isset($filters['payment_status']) && $filters['payment_status'] !== '') {
            $query->where('payment_status', (int) $filters['payment_status']);
        }

        if (!empty($filters['payment_method'])) {
            $query->whereHas('order.payment', function (Builder $paymentQuery) use ($filters) {
                $paymentQuery->withTrashed()
                    ->where('payment_method', $filters['payment_method']);
            });
        }

        $this->applyDateAndDeletedFilters($query, $filters);
    }

    private function applyDateAndDeletedFilters(Builder $query, array $filters): void
    {
        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (isset($filters['deleted']) && $filters['deleted'] !== '') {
            if ((int) $filters['deleted'] === 1) {
                $query->onlyTrashed();
            } else {
                $query->withoutTrashed();
            }
        }
    }

    private function getOrderStats(): array
    {
        $query = Order::query();

        return [
            'total' => (clone $query)->count(),
            'pending' => (clone $query)->where('status', 0)->count(),
            'processing' => (clone $query)->where('status', 1)->count(),
            'shipping' => (clone $query)->where('status', 2)->count(),
            'completed' => (clone $query)->where('status', 3)->count(),
            'cancelled' => (clone $query)->where('status', 4)->count(),
            'today' => (clone $query)->whereDate('created_at', today())->count(),
            'completed_revenue' => (float) (clone $query)
                ->where('status', 3)
                ->sum('grand_total'),
        ];
    }

    private function getSubOrderStats(): array
    {
        $query = SubOrder::query();

        return [
            'total' => (clone $query)->count(),
            'pending' => (clone $query)->where('status', 0)->count(),
            'preparing' => (clone $query)->where('status', 1)->count(),
            'shipping' => (clone $query)->where('status', 2)->count(),
            'completed' => (clone $query)->where('status', 3)->count(),
            'cancelled' => (clone $query)->where('status', 4)->count(),
            'today' => (clone $query)->whereDate('created_at', today())->count(),
            'completed_revenue' => (float) (clone $query)
                ->where('status', 3)
                ->sum('total'),
        ];
    }

    private function formatOrder(Order $order, bool $detail = false): array
    {
        $order->loadMissing([
            'user',
            'payment',
            'subOrders.farm',
            'subOrders.items',
            'cancelledBy',
            'subOrders.cancelledBy',
        ]);

        $data = [
            'id' => $order->id,
            'order_code' => $order->order_code,
            'customer' => $this->formatUser($order->user),
            'shipping_name' => $order->shipping_name,
            'shipping_phone' => $order->shipping_phone,
            'shipping_address' => $order->shipping_address,
            'items_total' => (float) $order->items_total,
            'shipping_fee' => (float) $order->shipping_fee,
            'grand_total' => (float) $order->grand_total,
            'status' => (int) $order->status,
            'status_text' => $this->getOrderStatusText((int) $order->status),
            'cancellation' => $order->cancelled_at ? [
                'reason' => $order->cancel_reason,
                'at' => optional($order->cancelled_at)->format('d/m/Y H:i'),
                'by' => $this->formatUser($order->cancelledBy),
            ] : null,
            'can_cancel_all' => !$order->trashed()
                && in_array((int) $order->status, [0, 1], true)
                && !$order->subOrders->contains(
                    fn (SubOrder $subOrder) => in_array((int) $subOrder->status, [2, 3], true)
                )
                && (int) ($order->payment?->status ?? 0) !== 1,
            'payment' => $this->formatPayment($order->payment),
            'sub_orders_count' => $order->subOrders->count(),
            'items_count' => $order->subOrders->sum(fn (SubOrder $subOrder) => $subOrder->items->count()),
            'items_quantity' => (float) $order->subOrders
                ->flatMap(fn (SubOrder $subOrder) => $subOrder->items)
                ->sum(fn (OrderItem $item) => (float) $item->quantity),
            'sub_orders' => $order->subOrders
                ->map(fn (SubOrder $subOrder) => $this->formatSubOrder($subOrder, $detail))
                ->values(),
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
            'deleted_at' => $order->deleted_at,
        ];

        if ($detail) {
            $data['address'] = $order->address ? [
                'id' => $order->address->id,
                'receiver_name' => $order->address->receiver_name,
                'phone' => $order->address->phone,
                'address_line' => $order->address->address_line,
                'ward' => $order->address->ward,
                'district' => $order->address->district,
                'province' => $order->address->province,
                'full_address' => $order->address->full_address,
                'deleted_at' => $order->address->deleted_at,
            ] : null;
        }

        return $data;
    }

    private function formatSubOrder(SubOrder $subOrder, bool $detail = false): array
    {
        $subOrder->loadMissing([
            'order.user',
            'order.payment',
            'farm.seller',
            'items',
            'cancelledBy',
        ]);

        $data = [
            'id' => $subOrder->id,
            'sub_order_code' => $subOrder->sub_order_code,
            'order_id' => $subOrder->order_id,
            'order_code' => $subOrder->order?->order_code,
            'parent_order_status' => $subOrder->order ? (int) $subOrder->order->status : null,
            'parent_order_status_text' => $subOrder->order
                ? $this->getOrderStatusText((int) $subOrder->order->status)
                : null,
            'farm' => $this->formatFarm($subOrder->farm),
            'customer' => $this->formatUser($subOrder->order?->user),
            'shipping_name' => $subOrder->order?->shipping_name,
            'shipping_phone' => $subOrder->order?->shipping_phone,
            'shipping_address' => $subOrder->order?->shipping_address,
            'items_total' => (float) $subOrder->items_total,
            'shipping_fee' => (float) $subOrder->shipping_fee,
            'total' => (float) $subOrder->total,
            'status' => (int) $subOrder->status,
            'status_text' => $this->getSubOrderStatusText((int) $subOrder->status),
            'cancellation' => $subOrder->cancelled_at ? [
                'reason' => $subOrder->cancel_reason,
                'at' => optional($subOrder->cancelled_at)->format('d/m/Y H:i'),
                'by' => $this->formatUser($subOrder->cancelledBy),
            ] : null,
            'payment_status' => (int) $subOrder->payment_status,
            'payment_status_text' => $this->getPaymentStatusText((int) $subOrder->payment_status),
            'payment_method' => $subOrder->order?->payment?->payment_method,
            'items_count' => $subOrder->items->count(),
            'items_quantity' => (float) $subOrder->items
                ->sum(fn (OrderItem $item) => (float) $item->quantity),
            'seller_note' => $subOrder->seller_note,
            'allowed_next_statuses' => $subOrder->trashed()
                ? []
                : $this->getAllowedNextStatuses((int) $subOrder->status),
            'created_at' => $subOrder->created_at,
            'updated_at' => $subOrder->updated_at,
            'deleted_at' => $subOrder->deleted_at,
        ];

        if ($detail) {
            $data['parent_order'] = $subOrder->order ? [
                'id' => $subOrder->order->id,
                'order_code' => $subOrder->order->order_code,
                'status' => (int) $subOrder->order->status,
                'status_text' => $this->getOrderStatusText((int) $subOrder->order->status),
                'items_total' => (float) $subOrder->order->items_total,
                'shipping_fee' => (float) $subOrder->order->shipping_fee,
                'grand_total' => (float) $subOrder->order->grand_total,
                'payment' => $this->formatPayment($subOrder->order->payment),
            ] : null;

            $data['items'] = $subOrder->items
                ->map(fn (OrderItem $item) => $this->formatOrderItem($item))
                ->values();
        }

        return $data;
    }

    private function formatOrderItem(OrderItem $item): array
    {
        $item->loadMissing([
            'product',
            'orderItemLots.harvestLot',
        ]);

        return [
            'id' => $item->id,
            'product_id' => $item->product_id,
            'product_name' => $item->product_name,
            'product_image' => $item->product_image,
            'unit' => $item->unit,
            'quantity' => (float) $item->quantity,
            'price' => (float) $item->price,
            'subtotal' => (float) $item->subtotal,
            'current_product' => $item->product ? [
                'id' => $item->product->id,
                'name' => $item->product->name,
                'slug' => $item->product->slug,
                'thumbnail' => $item->product->thumbnail,
                'status' => (int) $item->product->status,
                'deleted_at' => $item->product->deleted_at,
            ] : null,
            'allocated_lots' => $item->orderItemLots
                ->map(function ($itemLot) {
                    $lot = $itemLot->harvestLot;

                    return [
                        'id' => $itemLot->id,
                        'harvest_lot_id' => $itemLot->harvest_lot_id,
                        'lot_code' => $lot?->lot_code,
                        'quantity' => (float) $itemLot->quantity,
                        'harvest_date' => optional($lot?->harvest_date)->format('Y-m-d'),
                        'expiry_date' => optional($lot?->expiry_date)->format('Y-m-d'),
                        'lot_status' => $lot ? (int) $lot->status : null,
                        'mapping_deleted_at' => $itemLot->deleted_at,
                        'lot_deleted_at' => $lot?->deleted_at,
                    ];
                })
                ->values(),
        ];
    }

    private function formatUser(?User $user): ?array
    {
        if (!$user) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'status' => (int) $user->status,
            'deleted_at' => $user->deleted_at,
        ];
    }

    private function formatFarm(?Farm $farm): ?array
    {
        if (!$farm) {
            return null;
        }

        return [
            'id' => $farm->id,
            'name' => $farm->name,
            'slug' => $farm->slug,
            'logo' => $farm->logo,
            'phone' => $farm->phone,
            'address' => $farm->address,
            'status' => (int) $farm->status,
            'seller' => $this->formatUser($farm->seller),
            'deleted_at' => $farm->deleted_at,
        ];
    }

    private function formatPayment($payment): ?array
    {
        if (!$payment) {
            return null;
        }

        return [
            'id' => $payment->id,
            'transaction_code' => $payment->transaction_code,
            'payment_method' => $payment->payment_method,
            'amount' => (float) $payment->amount,
            'status' => (int) $payment->status,
            'status_text' => $this->getPaymentStatusText((int) $payment->status),
            'paid_at' => $payment->paid_at,
            'created_at' => $payment->created_at,
            'updated_at' => $payment->updated_at,
            'deleted_at' => $payment->deleted_at,
        ];
    }

    private function subOrderDetailRelations(): array
    {
        return [
            'order' => fn ($query) => $query->withTrashed()
                ->with([
                    'user' => fn ($userQuery) => $userQuery->withTrashed(),
                    'address' => fn ($addressQuery) => $addressQuery->withTrashed(),
                    'payment' => fn ($paymentQuery) => $paymentQuery->withTrashed(),
                ]),
            'farm' => fn ($query) => $query->withTrashed()
                ->with(['seller' => fn ($sellerQuery) => $sellerQuery->withTrashed()]),
            'items.product' => fn ($query) => $query
                ->withoutGlobalScope('farm_not_deleted')
                ->withTrashed(),
            'items.orderItemLots' => fn ($query) => $query->withTrashed(),
            'items.orderItemLots.harvestLot' => fn ($query) => $query->withTrashed(),
        ];
    }

    private function validateStatusTransition(int $currentStatus, int $newStatus): void
    {
        if ($currentStatus === $newStatus) {
            throw ValidationException::withMessages([
                'status' => ['Đơn theo nông trại đã ở trạng thái này.'],
            ]);
        }

        $allowed = [
            0 => [1, 4],
            1 => [2, 4],
            2 => [3],
            3 => [],
            4 => [],
        ];

        if (!in_array($newStatus, $allowed[$currentStatus] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => [
                    'Không thể chuyển từ "'
                    . $this->getSubOrderStatusText($currentStatus)
                    . '" sang "'
                    . $this->getSubOrderStatusText($newStatus)
                    . '".',
                ],
            ]);
        }
    }

    private function ensureCanCancelPaidMomoOrder(SubOrder $subOrder, int $newStatus): void
    {
        if ($newStatus !== 4) {
            return;
        }

        $subOrder->loadMissing('order.payment');

        $payment = $subOrder->order?->payment;
        $isPaidMomo = $payment?->payment_method === 'MOMO'
            && (
                (int) ($payment?->status ?? 0) === 1
                || (int) $subOrder->payment_status === 1
            );

        if ($isPaidMomo) {
            throw ValidationException::withMessages([
                'status' => [
                    'Không thể hủy đơn MoMo đã thanh toán. '
                    . 'Phải tích hợp quy trình hoàn tiền trước khi cho phép hủy.',
                ],
            ]);
        }
    }

    private function syncParentOrderStatus(Order $order): void
    {
        $statuses = $order->subOrders()
            ->pluck('status')
            ->map(fn ($status) => (int) $status);

        if ($statuses->isEmpty()) {
            return;
        }

        if ($statuses->every(fn ($status) => $status === 4)) {
            $status = 4;
        } elseif (
            $statuses->every(fn ($status) => in_array($status, [3, 4], true))
            && $statuses->contains(3)
        ) {
            $status = 3;
        } elseif ($statuses->contains(2)) {
            $status = 2;
        } elseif ($statuses->contains(1)) {
            $status = 1;
        } else {
            $status = 0;
        }

        $order->update(['status' => $status]);
    }

    private function syncParentPaymentStatus(Order $order): void
    {
        $payment = $order->payment;

        if (!$payment) {
            return;
        }

        $statuses = $order->subOrders()
            ->pluck('status')
            ->map(fn ($status) => (int) $status);

        if ($statuses->isEmpty()) {
            return;
        }

        if ($statuses->every(fn ($status) => $status === 4)) {
            $payment->update([
                'status' => (int) $payment->status === 1 ? 3 : 2,
            ]);

            return;
        }

        if (
            $statuses->every(fn ($status) => in_array($status, [3, 4], true))
            && $statuses->contains(3)
        ) {
            $payment->update([
                'status' => 1,
                'paid_at' => $payment->paid_at ?? now(),
            ]);
        }
    }

    private function getAllowedNextStatuses(int $status): array
    {
        $allowed = [
            0 => [1, 4],
            1 => [2, 4],
            2 => [3],
            3 => [],
            4 => [],
        ];

        return collect($allowed[$status] ?? [])
            ->map(fn (int $nextStatus) => [
                'value' => $nextStatus,
                'label' => $this->getSubOrderStatusText($nextStatus),
            ])
            ->values()
            ->all();
    }

    private function getOrderStatusText(int $status): string
    {
        return match ($status) {
            0 => 'Chờ xử lý',
            1 => 'Đang xử lý',
            2 => 'Đang giao',
            3 => 'Đã giao',
            4 => 'Đã hủy',
            default => 'Không xác định',
        };
    }

    private function getSubOrderStatusText(int $status): string
    {
        return match ($status) {
            0 => 'Chờ xử lý',
            1 => 'Chuẩn bị hàng',
            2 => 'Đang giao',
            3 => 'Hoàn tất',
            4 => 'Đã hủy',
            default => 'Không xác định',
        };
    }

    private function getPaymentStatusText(int $status): string
    {
        return match ($status) {
            0 => 'Chờ thanh toán',
            1 => 'Đã thanh toán',
            2 => 'Thất bại',
            3 => 'Đã hoàn tiền',
            default => 'Không xác định',
        };
    }

    private function formatMeta($paginator): array
    {
        return [
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }
}
