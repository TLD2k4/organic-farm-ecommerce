<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\UpdateSellerOrderStatusRequest;
use App\Services\Order\SellerOrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SellerOrderController extends Controller
{
    public function __construct(
        private SellerOrderService $sellerOrderService,
    ) {
    }

    /**
     * Danh sách đơn hàng của seller
     */
    public function index(Request $request)
    {
        $filters = $request->validate([
            'keyword' => [
                'nullable',
                'string',
                'max:100',
            ],

            'status' => [
                'nullable',
                'integer',
                'in:0,1,2,3,4',
            ],

            'payment_status' => [
                'nullable',
                'integer',
                'in:0,1,2,3',
            ],

            'date_from' => [
                'nullable',
                'date',
            ],

            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:5',
                'max:50',
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $data = $this->sellerOrderService->getVendorOrders(
            sellerId: (int) Auth::id(),
            filters: $filters,
        );

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đơn hàng thành công.',
            'data' => $data,
        ]);
    }

    /**
     * Chi tiết đơn hàng
     */
    public function show(int $id)
    {
        $data = $this->sellerOrderService->getVendorOrder(
            sellerId: (int) Auth::id(),
            subOrderId: $id,
        );

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết đơn hàng thành công.',
            'data' => $data,
        ]);
    }

    /**
     * Cập nhật trạng thái đơn hàng
     */
    public function updateStatus(UpdateSellerOrderStatusRequest $request, int $id)
    {
        $data = $this->sellerOrderService->updateVendorOrderStatus(
            sellerId: (int) Auth::id(),
            subOrderId: $id,
            newStatus: (int) $request->status,
            sellerNote: $request->input('seller_note'),
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái đơn hàng thành công.',
            'data' => $data,
        ]);
    }
}