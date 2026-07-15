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

        return response()->json([
            'success' => true,
            'message' => $request->payment_method === 'MOMO'
                ? 'Tạo đơn hàng thành công. Vui lòng thanh toán qua MoMo.'
                : 'Đặt hàng thành công.',
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

                'sub_orders' => $order->subOrders,
            ],
        ], 201);
    }
}
