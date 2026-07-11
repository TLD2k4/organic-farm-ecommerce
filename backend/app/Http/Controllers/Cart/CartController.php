<?php

namespace App\Http\Controllers\Cart;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\AddCartItemRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Services\Cart\CartService;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    public function __construct(
        private CartService $cartService,
    ) {
    }

    /**
     * Xem giỏ hàng
     */
    public function index()
    {
        $cart = $this->cartService->getCart(
            userId: (int) Auth::id()
        );

        return response()->json([
            'success' => true,
            'message' => 'Lấy giỏ hàng thành công.',
            'data' => $cart,
        ]);
    }

    /**
     * Thêm sản phẩm vào giỏ
     */
    public function store(AddCartItemRequest $request)
    {
        $cart = $this->cartService->addItem(
            userId: (int) Auth::id(),
            productId: (int) $request->product_id,
            quantity: (float) $request->quantity,
        );

        return response()->json([
            'success' => true,
            'message' => 'Thêm sản phẩm vào giỏ hàng thành công.',
            'data' => $cart,
        ], 201);
    }

    /**
     * Cập nhật số lượng
     */
    public function update(UpdateCartItemRequest $request, int $id)
    {
        $cart = $this->cartService->updateItem(
            userId: (int) Auth::id(),
            cartItemId: $id,
            quantity: (float) $request->quantity,
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật giỏ hàng thành công.',
            'data' => $cart,
        ]);
    }

    /**
     * Xóa 1 sản phẩm khỏi giỏ
     */
    public function destroy(int $id)
    {
        $cart = $this->cartService->removeItem(
            userId: (int) Auth::id(),
            cartItemId: $id,
        );

        return response()->json([
            'success' => true,
            'message' => 'Xóa sản phẩm khỏi giỏ hàng thành công.',
            'data' => $cart,
        ]);
    }

    /**
     * Xóa toàn bộ giỏ hàng
     */
    public function clear()
    {
        $cart = $this->cartService->clearCart(
            userId: (int) Auth::id()
        );

        return response()->json([
            'success' => true,
            'message' => 'Xóa toàn bộ giỏ hàng thành công.',
            'data' => $cart,
        ]);
    }
}