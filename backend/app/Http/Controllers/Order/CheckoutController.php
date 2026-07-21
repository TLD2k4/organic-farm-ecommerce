<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\CheckoutRequest;
use App\Services\Order\CheckoutService;

class CheckoutController extends Controller
{
    public function __construct(
        private CheckoutService $checkoutService,
    ) {}

    public function checkout(CheckoutRequest $request)
    {
        $result = $this->checkoutService->checkout(
            userId: (int) $request->user()->id,
            addressId: (int) $request->address_id,
            paymentMethod: $request->payment_method,
            cartItemIds: $request->validated('cart_item_ids'),
        );

        $order = $result['order'];

        $order->load([
            'payment',
            'subOrders',
        ]);

        $paymentRetryRequired = (bool) (
            $result['payment_retry_required'] ?? false
        );

        return response()->json([
            'success' => true,
            'message' => match (true) {
                $request->payment_method !== 'MOMO' => 'Đặt hàng thành công.',
                $paymentRetryRequired => 'Đơn hàng đã được tạo và đang chờ thanh toán. Chưa thể mở MoMo lúc này; bạn có thể thanh toán lại trong hồ sơ đơn hàng.',
                default => 'Tạo đơn hàng thành công. Vui lòng thanh toán qua MoMo.',
            },
            'data' => [
                'order_id' => $order->id,
                'order_code' => $order->order_code,
                'status' => $order->status,
                'grand_total' => $order->grand_total,

                'payment_method' => $order->payment?->payment_method,
                'payment_status' => $order->payment?->status,

                'payment_url' => $result['payment_url'],
                'deeplink' => $result['deeplink'],
                'qr_code_url' => $result['qr_code_url'],
                'payment_retry_required' => $paymentRetryRequired,

                'sub_orders' => $order->subOrders,
            ],
        ], 201);
    }
}
