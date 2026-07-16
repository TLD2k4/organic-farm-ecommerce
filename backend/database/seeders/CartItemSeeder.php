<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Database\Seeder;
use RuntimeException;

class CartItemSeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::query()
            ->where('status', 1)
            ->where('stock_quantity', '>', 5)
            ->whereHas('farm', fn ($query) => $query->where('status', 1))
            ->whereHas('certificate')
            ->orderBy('id')
            ->get();

        if ($products->isEmpty()) {
            throw new RuntimeException(
                'Không thể seed giỏ hàng: không có sản phẩm còn tồn kho và chứng chỉ hợp lệ.'
            );
        }

        Cart::query()
            ->orderBy('id')
            ->get()
            ->each(function (Cart $cart, int $cartIndex) use ($products) {
                $cart->items()->delete();

                $itemCount = min(3, $products->count());

                for ($itemIndex = 0; $itemIndex < $itemCount; $itemIndex++) {
                    $product = $products[
                        ($cartIndex + ($itemIndex * 5)) % $products->count()
                    ];

                    CartItem::updateOrCreate(
                        [
                            'cart_id' => $cart->id,
                            'product_id' => $product->id,
                        ],
                        ['quantity' => [1, 2, 1.5][$itemIndex]]
                    );
                }
            });
    }
}
