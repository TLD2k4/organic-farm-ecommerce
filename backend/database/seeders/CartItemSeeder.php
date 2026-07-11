<?php

namespace Database\Seeders;

use App\Models\CartItem;
use Illuminate\Database\Seeder;

class CartItemSeeder extends Seeder
{
    public function run(): void
    {
        for ($cartId = 1; $cartId <= 16; $cartId++) {
            $productOne = (($cartId - 1) % 20) + 1;
            $productTwo = (($cartId + 5) % 20) + 1;
            $productThree = (($cartId + 11) % 20) + 1;

            CartItem::create([
                'cart_id' => $cartId,
                'product_id' => $productOne,
                'quantity' => 1,
            ]);

            CartItem::create([
                'cart_id' => $cartId,
                'product_id' => $productTwo,
                'quantity' => 2,
            ]);

            CartItem::create([
                'cart_id' => $cartId,
                'product_id' => $productThree,
                'quantity' => 1.5,
            ]);
        }
    }
}