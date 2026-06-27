<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreVendorProductRequest;
use App\Http\Requests\Product\UpdateVendorProductRequest;
use App\Services\Product\ProductService;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        private ProductService $productService
    ) {}

    public function index(Request $request)
    {
        $filters = $request->validate([
            'vendor_id' => ['nullable', 'integer', 'exists:farms,id'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $products = $this->productService->getPublicProducts($filters);

        return response()->json([
            'success' => true,
            'data' => collect($products->items())->map(function ($product) {
                return $this->formatProduct($product);
            }),
            'meta' => [
                'total' => $products->total(),
                'per_page' => $products->perPage(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'from' => $products->firstItem(),
                'to' => $products->lastItem(),
            ],
        ]);
    }

    public function show(int $id)
    {
        $product = $this->productService->getDetail($id);

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết sản phẩm thành công',
            'data' => $this->formatProduct($product, true),
        ]);
    }

    public function storeVendorProduct(StoreVendorProductRequest $request)
    {
        $product = $this->productService->createVendorProduct(
            data: $request->validated(),
            sellerId: (int) $request->user()->getAuthIdentifier()
        );

        return response()->json([
            'success' => true,
            'message' => 'Thêm sản phẩm mới thành công',
            'id' => $product ->id,
        ], 201);
    }

    public function updateVendorProduct(UpdateVendorProductRequest $request, int $id)
    {
        $product = $this->productService->updateVendorProduct(
            data: $request->validated(),
            productId: $id,
            sellerId: (int) $request->user()->getAuthIdentifier()
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật sản phẩm thành công',
            'id' => $product ->id,
            'data' => $product,
        ]);
    }

    public function deleteVendorProduct(Request $request, int $id)
    {
        $this->productService->deleteVendorProduct(
            productId: $id,
            sellerId: (int) $request->user()->getAuthIdentifier()
        );

        return response()->json([
            'success' => true,
            'message' => 'Xóa sản phẩm thành công',
        ]);
    }

    private function formatProduct($product, bool $isDetail = false): array
    {
        $data = [
            'id' => $product->id,
            'farm_id' => $product->farm_id,
            'category_id' => $product->category_id,

            'name' => $product->name,
            'slug' => $product->slug,

            'price' => $product->price,
            'sale_price' => $product->sale_price,

            'stock_quantity' => $product->stock_quantity,
            'unit' => $product->unit,

            'thumbnail' => $product->thumbnail,

            'is_hot' => $product->is_hot,
            'status' => $product->status,

            'farm' => $product->farm ? [
                'id' => $product->farm->id,
                'name' => $product->farm->name,
            ] : null,

            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
            ] : null,
        ];

        if ($isDetail) {
            $data['description'] = $product->description;

            $data['images'] = $product->images->map(function ($image) {
                return [
                    'id' => $image->id,
                    'image_url' => $image->image_url,
                ];
            });
        }

        return $data;
    }
}