<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\AdminOrderIndexRequest;
use App\Http\Requests\Order\AdminSubOrderIndexRequest;
use App\Http\Requests\Order\UpdateAdminSubOrderStatusRequest;
use App\Services\Order\AdminOrderService;
use App\Services\Audit\AuditLogService;
use App\Models\SubOrder;
use App\Notifications\MarketplaceNotification;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    public function __construct(
        private AdminOrderService $adminOrderService,
        private AuditLogService $auditLogService,
    ) {}

    public function options()
    {
        return response()->json([
            'success' => true,
            'data' => $this->adminOrderService->getOptions(),
        ]);
    }

    public function index(AdminOrderIndexRequest $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đơn tổng thành công.',
            'data' => $this->adminOrderService->getOrders($request->validated()),
        ]);
    }

    public function show(int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết đơn tổng thành công.',
            'data' => $this->adminOrderService->getOrderDetail($id),
        ]);
    }

    public function subOrderIndex(AdminSubOrderIndexRequest $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đơn theo nông trại thành công.',
            'data' => $this->adminOrderService->getSubOrders($request->validated()),
        ]);
    }

    public function subOrderShow(int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết đơn theo nông trại thành công.',
            'data' => $this->adminOrderService->getSubOrderDetail($id),
        ]);
    }

    public function updateSubOrderStatus(
        UpdateAdminSubOrderStatusRequest $request,
        int $id,
    ) {
        $subOrder = SubOrder::query()
            ->with(['order.user', 'farm.seller'])
            ->findOrFail($id);
        $currentStatus = (int) $subOrder->status;

        $data = $this->adminOrderService->updateSubOrderStatus(
            subOrderId: $id,
            newStatus: (int) $request->validated('status'),
        );

        $this->auditLogService->record(
            $request->user(),
            'sub_order',
            $id,
            'status_update',
            $currentStatus,
            (int) $request->validated('status'),
            $request->validated('reason'),
            [
                'farm_id' => $data['farm']['id'] ?? $data['farm_id'] ?? null,
                'order_id' => $data['order_id'] ?? null,
            ]
        );

        $message = 'Đơn ' . $subOrder->sub_order_code
            . ' đã chuyển trạng thái từ ' . $currentStatus
            . ' sang ' . $request->validated('status')
            . '. Lý do: ' . $request->validated('reason');

        $subOrder->order?->user?->notify(new MarketplaceNotification(
            'order.status_updated',
            'Đơn hàng đã cập nhật',
            $message,
            '/profile?tab=orders',
            $request->user(),
            ['order_id' => $subOrder->order_id, 'sub_order_id' => $id]
        ));

        $subOrder->farm?->seller?->notify(new MarketplaceNotification(
            'order.status_updated_by_admin',
            'Admin đã cập nhật đơn hàng',
            $message,
            '/seller/orders',
            $request->user(),
            ['order_id' => $subOrder->order_id, 'sub_order_id' => $id]
        ));

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái đơn theo nông trại thành công.',
            'data' => $data,
        ]);
    }

    public function cancelOrder(Request $request, int $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $order = \App\Models\Order::query()
            ->with(['user', 'subOrders.farm.seller'])
            ->findOrFail($id);
        $fromStatus = (int) $order->status;

        $data = $this->adminOrderService->cancelParentOrder(
            $id,
            $validated['reason'],
            $request->user()->id
        );

        $this->auditLogService->record(
            $request->user(), 'order', $id, 'cancel_all',
            $fromStatus, 4, $validated['reason']
        );

        $message = 'Đơn ' . $order->order_code
            . ' đã bị hủy toàn bộ. Lý do: ' . $validated['reason'];
        $order->user?->notify(new MarketplaceNotification(
            'order.cancelled_by_admin', 'Đơn hàng đã bị hủy', $message,
            '/profile?tab=orders', $request->user(), ['order_id' => $id]
        ));

        $order->subOrders
            ->pluck('farm.seller')
            ->filter()
            ->unique('id')
            ->each(fn ($seller) => $seller->notify(new MarketplaceNotification(
                'order.cancelled_by_admin', 'Đơn hàng đã bị hủy', $message,
                '/seller/orders', $request->user(), ['order_id' => $id]
            )));

        return response()->json([
            'success' => true,
            'message' => 'Hủy toàn bộ đơn hàng thành công và đã hoàn kho.',
            'data' => $data,
        ]);
    }
}
