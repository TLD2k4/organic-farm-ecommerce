<?php

namespace App\Services\Product;

use App\Models\Farm;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductService
{
    public function getPublicProducts(array $filters = []): LengthAwarePaginator
    {
        $query = Product::query()
            ->with(['farm', 'category'])
            ->where('status', 1)
            ->orderBy('id', 'desc');

        if (!empty($filters['vendor_id'])) {
            // vendor_id API = farm_id trong DB
            $query->where('farm_id', $filters['vendor_id']);
        }

        if (!empty($filters['min_price'])) {
            $query->whereRaw('COALESCE(sale_price, price) >= ?', [$filters['min_price']]);
        }

        if (!empty($filters['max_price'])) {
            $query->whereRaw('COALESCE(sale_price, price) <= ?', [$filters['max_price']]);
        }

        $limit = $filters['limit'] ?? 10;

        return $query->paginate($limit);
    }

    public function getDetail(int $id): Product
    {
        return Product::with(['farm', 'category', 'images'])
            ->where('status', 1)
            ->findOrFail($id);
    }

    public function createVendorProduct(array $data, int $sellerId): Product
    {
        $farm = Farm::where('seller_id', $sellerId)->first();

        if (!$farm) {
            abort(403, 'Tài khoản người bán chưa có gian hàng');
        }

        $data['name'] = trim($data['name']);

        $this->ensureProductNameNotExistsInFarm(
            farmId: $farm->id,
            name: $data['name']
        );

        return DB::transaction(function () use ($data, $farm) {
            // detail_images chỉ là field request, không có trong bảng products
            $detailImages = $data['detail_images'] ?? [];

            unset($data['detail_images']);
            unset($data['stock_quantity']);
            unset($data['status']);

            $data['farm_id'] = $farm->id;
            $data['slug'] = $this->generateUniqueSlug($data['name']);

            // Stock mặc định = 0
            $data['stock_quantity'] = 0;

            $data['is_hot'] = $data['is_hot'] ?? 0;

            // Seller tạo sản phẩm xong mặc định chờ duyệt
            $data['status'] = 0;

            // FE gửi thumbnail, BE lưu vào products.thumbnail
            $product = Product::create($data);

            // Ảnh đầu tiên trong product_images = thumbnail
            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $product->thumbnail,
            ]);

            // Ảnh thứ 2, 3... lưu vào product_images
            foreach ($detailImages as $imageUrl) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_url' => $imageUrl,
                ]);
            }

            return $product->load(['farm', 'category', 'images']);
        });
    }

    public function updateVendorProduct(array $data, int $productId, int $sellerId): Product
    {
        $product = $this->findSellerProduct($productId, $sellerId);

        // Lấy giá cuối cùng sau khi update
        $finalPrice = $data['price'] ?? $product->price;

        // Nếu request có gửi sale_price thì lấy sale_price mới,
        // nếu không gửi thì lấy sale_price cũ trong DB
        $finalSalePrice = array_key_exists('sale_price', $data)
            ? $data['sale_price']
            : $product->sale_price;

        // Giá khuyến mãi không được lớn hơn giá gốc
        if ($finalSalePrice !== null && (float) $finalSalePrice > (float) $finalPrice) {
            throw ValidationException::withMessages([
                'sale_price' => ['Giá khuyến mãi không được lớn hơn giá gốc.'],
            ]);
        }

        // Nếu có cập nhật tên thì tự tạo lại slug
        if (isset($data['name'])) {
            $data['name'] = trim($data['name']);

            $this->ensureProductNameNotExistsInFarm(
                farmId: $product->farm_id,
                name: $data['name'],
                ignoreId: $product->id
            );

            $data['slug'] = $this->generateUniqueSlug($data['name'], $product->id);
        }

        // Seller chỉ được đổi trạng thái giữa:
        // 1 = Đang bán
        // 3 = Tạm ẩn
        if (array_key_exists('status', $data)) {
            $currentStatus = (int) $product->status;
            $newStatus = (int) $data['status'];

            // Sản phẩm hiện tại phải đang bán hoặc tạm ẩn mới cho đổi
            if (!in_array($currentStatus, [1, 3], true)) {
                throw ValidationException::withMessages([
                    'status' => ['Chỉ sản phẩm đang bán hoặc tạm ẩn mới được thay đổi trạng thái.'],
                ]);
            }

            // Seller chỉ được gửi status = 1 hoặc 3
            if (!in_array($newStatus, [1, 3], true)) {
                throw ValidationException::withMessages([
                    'status' => ['Người bán chỉ được chuyển sản phẩm sang đang bán hoặc tạm ẩn.'],
                ]);
            }
        }

        return DB::transaction(function () use ($data, $product) {
            // Không cho update tồn kho bằng Product API
            unset($data['stock_quantity']);

            $hasDetailImages = array_key_exists('detail_images', $data);
            $detailImages = $data['detail_images'] ?? [];

            // detail_images không phải cột trong bảng products
            unset($data['detail_images']);

            $oldThumbnail = $product->thumbnail;

            $product->update($data);

            // Lấy ảnh đầu tiên trong product_images
            $firstImage = $product->images()
                ->orderBy('id')
                ->first();

            // Nếu chưa có ảnh đầu tiên thì tạo bằng thumbnail hiện tại
            if (!$firstImage) {
                $firstImage = ProductImage::create([
                    'product_id' => $product->id,
                    'image_url' => $product->thumbnail,
                ]);
            }

            // Nếu đổi thumbnail thì cập nhật ảnh đầu tiên trong product_images
            if (isset($data['thumbnail']) && $product->thumbnail !== $oldThumbnail) {
                $firstImage->update([
                    'image_url' => $product->thumbnail,
                ]);
            }

            // Nếu gửi detail_images thì thay ảnh thứ 2 trở đi
            if ($hasDetailImages) {
                $product->images()
                    ->where('id', '!=', $firstImage->id)
                    ->delete();

                foreach ($detailImages as $imageUrl) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $imageUrl,
                    ]);
                }
            }

            return $product->fresh(['farm', 'category', 'images']);
        });
    }

    public function deleteVendorProduct(int $productId, int $sellerId): void
    {
        $product = $this->findSellerProduct($productId, $sellerId);

        // Xóa mềm bằng deleted_at, không đổi status
        $product->delete();
    }

    private function findSellerProduct(int $productId, int $sellerId): Product
    {
        $farm = Farm::where('seller_id', $sellerId)->first();

        if (!$farm) {
            abort(403, 'Tài khoản người bán chưa có gian hàng');
        }

        return Product::where('id', $productId)
            ->where('farm_id', $farm->id)
            ->firstOrFail();
    }

    private function ensureProductNameNotExistsInFarm(
        int $farmId,
        string $name,
        ?int $ignoreId = null
    ): void {
        $exists = Product::where('farm_id', $farmId)
            ->where('name', $name)
            ->when($ignoreId, function ($query) use ($ignoreId) {
                $query->where('id', '!=', $ignoreId);
            })
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'name' => ['Gian hàng đã có sản phẩm cùng tên.'],
            ]);
        }
    }

    private function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $count = 1;

        while (
            Product::withTrashed()
                ->where('slug', $slug)
                ->when($ignoreId, function ($query) use ($ignoreId) {
                    $query->where('id', '!=', $ignoreId);
                })
                ->exists()
        ) {
            $slug = $originalSlug . '-' . $count;
            $count++;
        }

        return $slug;
    }
}