<?php

namespace App\Services\Order;

use App\Models\Address;
use App\Models\Cart;
use App\Services\Payment\MomoPaymentService;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        private OrderBuilderService $orderBuilderService,
        private MomoPaymentService $momoPaymentService,
    ) {}

    public function checkout(
        int $userId,
        int $addressId,
        string $paymentMethod
    ): array {
        $cart = Cart::with([
            'items.product.farm',
            'items.product.certificate',
        ])
            ->where('user_id', $userId)
            ->first();

        if (!$cart) {
            throw ValidationException::withMessages([
                'cart' => ['Giỏ hàng không tồn tại.'],
            ]);
        }

        if ($cart->items->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => ['Giỏ hàng đang trống.'],
            ]);
        }

        $address = Address::where('id', $addressId)
            ->where('user_id', $userId)
            ->first();

        if (!$address) {
            throw ValidationException::withMessages([
                'address' => ['Địa chỉ giao hàng không tồn tại.'],
            ]);
        }

        $order = $this->orderBuilderService->build(
            cart: $cart,
            address: $address,
            paymentMethod: $paymentMethod,
        );

        $momoPayment = null;

        if ($paymentMethod === 'MOMO') {
            $momoPayment = $this->momoPaymentService->createPayment($order);
        }

        return [
            'order' => $order,
            'payment_url' => $momoPayment['payment_url'] ?? null,
            'deeplink' => $momoPayment['deeplink'] ?? null,
            'qr_code_url' => $momoPayment['qr_code_url'] ?? null,
        ];
    }
}