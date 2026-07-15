<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Services\Order\BuyerOrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BuyerOrderController extends Controller
{
    public function __construct(
        private BuyerOrderService $buyerOrderService,
    ) {
    }

    /**
     * Danh sách đơn hàng của buyer
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

        $data = $this->buyerOrderService->getBuyerOrders(
            userId: (int) Auth::id(),
            filters: $filters,
        );

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đơn hàng thành công.',
            'data' => $data,
        ]);
    }

    /**
     * Chi tiết đơn hàng của buyer
     */
    public function show(int $id)
    {
        $data = $this->buyerOrderService->getBuyerOrder(
            userId: (int) Auth::id(),
            orderId: $id,
        );

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết đơn hàng thành công.',
            'data' => $data,
        ]);
    }

    /**
     * Buyer hủy đơn hàng
     */
    public function cancel(Request $request, int $id)
    {
        $validated = $request->validate([
            'cancel_reason' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        $data = $this->buyerOrderService->cancelBuyerOrder(
            userId: (int) Auth::id(),
            orderId: $id,
            cancelReason: $validated['cancel_reason'] ?? null,
        );

        return response()->json([
            'success' => true,
            'message' => 'Hủy đơn hàng thành công.',
            'data' => $data,
        ]);
    }

    public function retryMomo(Request $request, int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Đã tạo phiên thanh toán MoMo mới.',
            'data' => $this->buyerOrderService->retryMomoPayment((int) $request->user()->id, $id),
        ]);
    }

    public function changePaymentMethod(Request $request, int $id)
    {
        $validated = $request->validate([
            'payment_method' => ['required', 'string', 'in:COD,MOMO'],
        ]);
        return response()->json([
            'success' => true,
            'message' => 'Đã đổi phương thức thanh toán.',
            'data' => $this->buyerOrderService->changePendingPaymentMethod((int) $request->user()->id, $id, $validated['payment_method']),
        ]);
    }
}
