<?php

namespace App\Services\Cart;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartService
{
    /**
     * Lấy giỏ hàng của user
     */
    public function getCart(int $userId): array
    {
        $cart = Cart::firstOrCreate([
            'user_id' => $userId,
        ]);

        $cart->load([
            'items.product.farm',
            'items.product.certificate',
        ]);

        return $this->formatCart($cart);
    }

    /**
     * Thêm sản phẩm vào giỏ hàng
     */
    public function addItem(int $userId, int $productId, float $quantity): array
    {
        return DB::transaction(function () use ($userId, $productId, $quantity) {
            $cart = Cart::firstOrCreate([
                'user_id' => $userId,
            ]);

            $product = Product::with(['farm', 'certificate'])
                ->where('id', $productId)
                ->first();

            $this->validateProductCanBuy($product, $quantity);

            $cartItem = CartItem::where('cart_id', $cart->id)
                ->where('product_id', $productId)
                ->first();

            if ($cartItem) {
                $newQuantity = (float) $cartItem->quantity + $quantity;

                $this->validateProductCanBuy($product, $newQuantity);

                $cartItem->update([
                    'quantity' => $newQuantity,
                ]);
            } else {
                CartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                ]);
            }

            $cart->load([
                'items.product.farm',
                'items.product.certificate',
            ]);

            return $this->formatCart($cart);
        });
    }

    /**
     * Cập nhật số lượng sản phẩm trong giỏ
     */
    public function updateItem(int $userId, int $cartItemId, float $quantity): array
    {
        return DB::transaction(function () use ($userId, $cartItemId, $quantity) {
            $cart = Cart::where('user_id', $userId)->first();

            if (!$cart) {
                throw ValidationException::withMessages([
                    'cart' => ['Giỏ hàng không tồn tại.'],
                ]);
            }

            $cartItem = CartItem::with(['product.farm', 'product.certificate'])
                ->where('id', $cartItemId)
                ->where('cart_id', $cart->id)
                ->first();

            if (!$cartItem) {
                throw ValidationException::withMessages([
                    'cart_item' => ['Sản phẩm không tồn tại trong giỏ hàng.'],
                ]);
            }

            $this->validateProductCanBuy($cartItem->product, $quantity);

            $cartItem->update([
                'quantity' => $quantity,
            ]);

            $cart->load([
                'items.product.farm',
                'items.product.certificate',
            ]);

            return $this->formatCart($cart);
        });
    }

    /**
     * Xóa một sản phẩm khỏi giỏ
     */
    public function removeItem(int $userId, int $cartItemId): array
    {
        return DB::transaction(function () use ($userId, $cartItemId) {
            $cart = Cart::where('user_id', $userId)->first();

            if (!$cart) {
                throw ValidationException::withMessages([
                    'cart' => ['Giỏ hàng không tồn tại.'],
                ]);
            }

            $cartItem = CartItem::where('id', $cartItemId)
                ->where('cart_id', $cart->id)
                ->first();

            if (!$cartItem) {
                throw ValidationException::withMessages([
                    'cart_item' => ['Sản phẩm không tồn tại trong giỏ hàng.'],
                ]);
            }

            $cartItem->delete();

            $cart->load([
                'items.product.farm',
                'items.product.certificate',
            ]);

            return $this->formatCart($cart);
        });
    }

    /**
     * Xóa toàn bộ giỏ hàng
     */
    public function clearCart(int $userId): array
    {
        return DB::transaction(function () use ($userId) {
            $cart = Cart::firstOrCreate([
                'user_id' => $userId,
            ]);

            $cart->items()->delete();

            $cart->load([
                'items.product.farm',
                'items.product.certificate',
            ]);

            return $this->formatCart($cart);
        });
    }

    /**
     * Kiểm tra sản phẩm có được mua không
     */
    private function validateProductCanBuy(?Product $product, float $quantity): void
    {
        if (!$product) {
            throw ValidationException::withMessages([
                'product_id' => ['Sản phẩm không tồn tại.'],
            ]);
        }

        if ((int) $product->status !== 1) {
            throw ValidationException::withMessages([
                'product_id' => ['Sản phẩm hiện không được bán.'],
            ]);
        }

        if (!$product->certificate) {
            throw ValidationException::withMessages([
                'product_id' => ['Sản phẩm chưa có chứng nhận hợp lệ.'],
            ]);
        }

        if ($quantity <= 0) {
            throw ValidationException::withMessages([
                'quantity' => ['Số lượng phải lớn hơn 0.'],
            ]);
        }

        if ((float) $product->stock_quantity <= 0) {
            throw ValidationException::withMessages([
                'quantity' => ['Sản phẩm đã hết hàng.'],
            ]);
        }

        if ($quantity > (float) $product->stock_quantity) {
            throw ValidationException::withMessages([
                'quantity' => [
                    'Số lượng vượt quá tồn kho hiện có. Hiện còn '
                        . $product->stock_quantity . ' ' . $product->unit . '.'
                ],
            ]);
        }
    }

    /**
     * Format dữ liệu giỏ hàng trả về frontend
     */
    private function formatCart(Cart $cart): array
    {
        $items = [];
        $itemsTotal = 0;
        $itemsCount = 0;

        foreach ($cart->items as $item) {
            $product = $item->product;

            if (!$product) {
                continue;
            }

            $price = $this->getProductPrice($product);
            $quantity = (float) $item->quantity;
            $subtotal = $price * $quantity;

            $itemsTotal += $subtotal;
            $itemsCount += 1;

            $items[] = [
                'id' => $item->id,
                'product_id' => $product->id,
                'product_slug' => $product->slug,
                'product_name' => $product->name,
                'product_image' => $product->thumbnail,
                'farm_id' => $product->farm_id,
                'farm_name' => $product->farm?->name,
                'unit' => $product->unit,
                'price' => $price,
                'original_price' => (float) $product->price,
                'sale_price' => $product->sale_price !== null
                    ? (float) $product->sale_price
                    : null,
                'quantity' => $quantity,
                'stock_quantity' => (float) $product->stock_quantity,
                'subtotal' => $subtotal,
                'is_available' => $this->isProductAvailable($product, $quantity),
            ];
        }

        return [
            'id' => $cart->id,
            'user_id' => $cart->user_id,
            'items_count' => $itemsCount,
            'items_total' => $itemsTotal,
            'items' => $items,
        ];
    }

    private function getProductPrice(Product $product): float
    {
        if ($product->sale_price !== null && (float) $product->sale_price > 0) {
            return (float) $product->sale_price;
        }

        return (float) $product->price;
    }

    private function isProductAvailable(Product $product, float $quantity): bool
    {
        return (int) $product->status === 1
            && $product->certificate !== null
            && (float) $product->stock_quantity >= $quantity;
    }
}
