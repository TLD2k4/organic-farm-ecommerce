<?php

namespace App\Services\Order;

use App\Models\Address;
use App\Models\Cart;
use App\Models\Order;
use App\Models\User;
use App\Notifications\MarketplaceNotification;
use App\Services\Payment\MomoPaymentService;
use Illuminate\Validation\ValidationException;
use Throwable;

class CheckoutService
{
    public function __construct(
        private OrderBuilderService $orderBuilderService,
        private MomoPaymentService $momoPaymentService,
    ) {}

    public function checkout(
        int $userId,
        int $addressId,
        string $paymentMethod,
        array $cartItemIds,
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

        $selectedItems = $cart->items
            ->whereIn('id', array_map('intval', $cartItemIds))
            ->values();
        if ($selectedItems->count() !== count(array_unique($cartItemIds))) {
            throw ValidationException::withMessages([
                'cart_item_ids' => ['Có sản phẩm không thuộc giỏ hàng của bạn.'],
            ]);
        }
        $cart->setRelation('items', $selectedItems);

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
        $paymentRetryRequired = false;

        if ($paymentMethod === 'MOMO') {
            try {
                $momoPayment = $this->momoPaymentService->createPayment($order);
            } catch (Throwable $exception) {
                // Đơn đã được tạo và giao dịch database đã commit. Không trả lỗi
                // như thể checkout thất bại vì Buyer có thể thanh toán lại từ hồ sơ.
                report($exception);
                $paymentRetryRequired = true;
            }
        }

        $this->notifyOrderCreated($order);

        return [
            'order' => $order,
            'payment_url' => $momoPayment['payment_url'] ?? null,
            'deeplink' => $momoPayment['deeplink'] ?? null,
            'qr_code_url' => $momoPayment['qr_code_url'] ?? null,
            'payment_retry_required' => $paymentRetryRequired,
        ];
    }

    private function notifyOrderCreated(Order $order): void
    {
        foreach ($order->subOrders as $subOrder) {
            try {
                $subOrder->farm?->seller?->notify(new MarketplaceNotification(
                    'order.created',
                    'Có đơn hàng mới',
                    'Đơn ' . $subOrder->sub_order_code
                        . ' vừa được tạo với tổng tiền '
                        . number_format((float) $subOrder->total, 0, ',', '.') . ' đ.',
                    '/seller/orders',
                    null,
                    ['order_id' => $order->id, 'sub_order_id' => $subOrder->id]
                ));
            } catch (Throwable $exception) {
                // Gửi thông báo là bước phụ, không được làm checkout đã commit
                // bị trả về lỗi và khiến Buyer tưởng đơn chưa được tạo.
                report($exception);
            }
        }

        try {
            User::role('admin')->each(function (User $admin) use ($order) {
                $admin->notify(new MarketplaceNotification(
                    'order.created',
                    'Hệ thống có đơn hàng mới',
                    'Đơn ' . $order->order_code . ' vừa được tạo.',
                    '/admin/orders',
                    null,
                    ['order_id' => $order->id]
                ));
            });
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
