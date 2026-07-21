<?php

namespace App\Services\Order;

use App\Models\Address;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Payment;
use App\Models\SubOrder;
use App\Models\OrderItem;
use App\Services\Farm\SellerPolicyAccessService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderBuilderService
{
    public function __construct(
        private InventoryService $inventoryService,
        private OrderCodeService $orderCodeService,
        private SellerPolicyAccessService $sellerPolicyAccessService,
    ) {
    }

    /**
     * Xây dựng toàn bộ Order
     */
    public function build(
        Cart $cart,
        Address $address,
        string $paymentMethod
    ): Order {
        $cart->loadMissing([
            'items.product.certificate',
            'items.product.farm',
        ]);

        if ($cart->items->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => [
                    'Giỏ hàng đang trống.'
                ]
            ]);
        }

        if ((int) $address->user_id !== (int) $cart->user_id) {
            throw ValidationException::withMessages([
                'address' => [
                    'Địa chỉ không hợp lệ.'
                ]
            ]);
        }

        return DB::transaction(function () use ($cart, $address, $paymentMethod) {

            /*
            |--------------------------------------------------------------------------
            | 1. Kiểm tra sản phẩm + tồn kho
            |--------------------------------------------------------------------------
            */

            foreach ($cart->items as $item) {
                $this->validateCartItemCanCheckout($item);

                $this->inventoryService->checkStock(
                    $item->product_id,
                    (float) $item->quantity
                );
            }

            /*
            |--------------------------------------------------------------------------
            | 2. Group theo Farm
            |--------------------------------------------------------------------------
            */

            $groups = $cart->items->groupBy(function ($item) {
                return $item->product->farm_id;
            });

            /*
            |--------------------------------------------------------------------------
            | 3. Tính tiền Order
            |--------------------------------------------------------------------------
            */

            $itemsTotal = 0;

            foreach ($cart->items as $item) {
                $itemsTotal +=
                    (float) $item->quantity *
                    $this->getProductPrice($item->product);
            }

            /*
                Demo:
                Mỗi Farm = 30k ship
                Sau này thay bằng GHN
            */

            $shippingFee = $groups->count() * 30000;

            /*
            |--------------------------------------------------------------------------
            | 4. Tạo Order
            |--------------------------------------------------------------------------
            */

            $order = Order::create([
                'user_id' => $cart->user_id,

                'address_id' => $address->id,

                'order_code' => $this->orderCodeService
                    ->generateOrderCode(),

                'shipping_name' => $address->receiver_name,

                'shipping_phone' => $address->phone,

                'shipping_address' => $this->formatShippingAddress($address),

                'shipping_fee' => $shippingFee,

                'items_total' => $itemsTotal,

                'grand_total' => $itemsTotal + $shippingFee,

                // Pending
                'status' => 0,
            ]);

            /*
            |--------------------------------------------------------------------------
            | 5. Tạo Sub Orders
            |--------------------------------------------------------------------------
            */

            foreach ($groups as $farmId => $items) {
                $this->createSubOrder(
                    order: $order,
                    farmId: (int) $farmId,
                    items: $items,
                );
            }

            /*
            |--------------------------------------------------------------------------
            | 6. Payment
            |--------------------------------------------------------------------------
            */

            Payment::create([
                'order_id' => $order->id,

                'transaction_code' => $this->orderCodeService
                    ->generateTransactionCode(),

                'payment_method' => $paymentMethod,

                'amount' => $order->grand_total,

                // Pending
                'status' => 0,
            ]);

            /*
            |--------------------------------------------------------------------------
            | 7. Xóa giỏ hàng
            |--------------------------------------------------------------------------
            */

            $cart->items()->whereIn('id', $cart->items->pluck('id'))->delete();

            return $order->fresh([
                'address',
                'payment',
                'subOrders.farm',
                'subOrders.items.product',
            ]);
        });
    }

    /**
     * Tạo Sub Order
     */
    private function createSubOrder(
        Order $order,
        int $farmId,
        Collection $items
    ): void {
        $itemsTotal = 0;

        foreach ($items as $item) {
            $itemsTotal +=
                (float) $item->quantity *
                $this->getProductPrice($item->product);
        }

        /*
            Demo:
            Sau này thay bằng GHN
        */

        $shippingFee = 30000;

        $subOrder = SubOrder::create([
            'order_id' => $order->id,

            'farm_id' => $farmId,

            'sub_order_code' => $this->orderCodeService
                ->generateSubOrderCode(),

            'items_total' => $itemsTotal,

            'shipping_fee' => $shippingFee,

            'total' => $itemsTotal + $shippingFee,

            // Pending
            'status' => 0,

            // Pending Payment
            'payment_status' => 0,

            'seller_note' => null,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Tạo Order Items
        |--------------------------------------------------------------------------
        */

        foreach ($items as $cartItem) {
            $product = $cartItem->product;

            $price = $this->getProductPrice($product);

            $orderItem = OrderItem::create([
                'sub_order_id' => $subOrder->id,

                'product_id' => $product->id,

                'product_name' => $product->name,

                'product_image' => $product->thumbnail,

                'unit' => $product->unit,

                'quantity' => $cartItem->quantity,

                'price' => $price,

                'subtotal' => (float) $cartItem->quantity * $price,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Trừ tồn kho FIFO
            |--------------------------------------------------------------------------
            */

            $this->inventoryService->allocateLots($orderItem);
        }
    }

    /**
     * Lấy giá bán thực tế
     */
    private function getProductPrice($product): float
    {
        if ($product->sale_price !== null && (float) $product->sale_price > 0) {
            return (float) $product->sale_price;
        }

        return (float) $product->price;
    }

    /**
     * Check sản phẩm còn được checkout không
     */
    private function validateCartItemCanCheckout($item): void
    {
        $product = $item->product;
        $quantity = round((float) $item->quantity, 2);

        if (!$product) {
            throw ValidationException::withMessages([
                'product' => [
                    'Một sản phẩm trong giỏ hàng không còn tồn tại.'
                ]
            ]);
        }

        if (!$product->isPubliclyVisible()) {
            throw ValidationException::withMessages([
                'product' => [
                    'Sản phẩm "' . $product->name
                    . '" hiện không còn đủ điều kiện công khai để đặt hàng.'
                ]
            ]);
        }

        if ($quantity < 0.1) {
            throw ValidationException::withMessages([
                'quantity' => [
                    'Khối lượng tối thiểu của sản phẩm "' . $product->name . '" là 0,1 kg.'
                ]
            ]);
        }

        // Chỉ áp dụng khi tạo đơn mới. Đơn đã tạo không đi qua kiểm tra này,
        // nên seller vẫn có thể hoàn tất nghĩa vụ giao hàng sau khi chính sách đổi.
        $this->sellerPolicyAccessService->ensureCanReceiveNewOrder($product->farm);
    }

    /**
     * Format địa chỉ giao hàng
     */
    private function formatShippingAddress(Address $address): string
    {
        return collect([
            $address->address_line,
            $address->ward,
            $address->district,
            $address->province,
        ])
            ->filter()
            ->implode(', ');
    }
}
