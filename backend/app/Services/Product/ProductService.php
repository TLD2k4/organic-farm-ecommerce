<?php

namespace App\Services\Product;

use App\Models\Farm;
use App\Models\Product;
use App\Models\Category;
use App\Models\ProductImage;
use App\Models\ProductCertificate;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\Collection;

class ProductService
{
    public function getPublicProducts(array $filters = []): LengthAwarePaginator
    {
        $query = Product::query()
            ->with(['farm', 'category', 'certificate.certification'])
            ->withCount([
                'completedOrderItems as order_count',
                'visibleRatingReviews as review_count',
                'visibleComments as comment_count',
                'visibleReviewReplies as reply_comment_count',
            ])
            ->withSum('completedOrderItems as sold_quantity', 'quantity')
            ->withAvg('visibleRatingReviews as rating_avg', 'rating')
            ->where('status', 1)
            ->whereHas('farm', function ($farmQuery) {
                $farmQuery->where('status', Farm::STATUS_ACTIVE);
            })
            ->whereHas('certificate');

        if (!empty($filters['vendor_id'])) {
            $query->where('farm_id', $filters['vendor_id']);
        }

        if (!empty($filters['category_slug'])) {
            $category = Category::query()
                ->where('slug', $filters['category_slug'])
                ->where('status', 1)
                ->firstOrFail();

            $categoryIds = Category::query()
                ->where('status', 1)
                ->where(function ($categoryQuery) use ($category) {
                    $categoryQuery
                        ->where('id', $category->id)
                        ->orWhere('parent_id', $category->id);
                })
                ->pluck('id')
                ->toArray();

            $query->whereIn('category_id', $categoryIds);
        } elseif (!empty($filters['category_id'])) {
            $category = Category::query()
                ->whereKey($filters['category_id'])
                ->where('status', 1)
                ->firstOrFail();

            $categoryIds = Category::query()
                ->where('status', 1)
                ->where(function ($categoryQuery) use ($category) {
                    $categoryQuery
                        ->where('id', $category->id)
                        ->orWhere('parent_id', $category->id);
                })
                ->pluck('id')
                ->toArray();

            $query->whereIn('category_id', $categoryIds);
        }

        if (!empty($filters['certification_id'])) {
            $query->whereHas('certificate', function ($q) use ($filters) {
                $q->where('certification_id', $filters['certification_id']);
            });
        }

        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);
            $productId = $this->extractVendorProductId($keyword);

            $query->where(function ($q) use ($keyword, $productId) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('slug', 'like', "%{$keyword}%")
                    ->orWhereHas('category', function ($categoryQuery) use ($keyword) {
                        $categoryQuery->where('name', 'like', "%{$keyword}%");
                    })
                    ->when(
                        $productId !== null,
                        fn ($idQuery) => $idQuery->orWhereKey($productId)
                    );
            });
        }

        if (isset($filters['min_price']) && $filters['min_price'] !== '') {
            $query->whereRaw('COALESCE(sale_price, price) >= ?', [$filters['min_price']]);
        }

        if (isset($filters['max_price']) && $filters['max_price'] !== '') {
            $query->whereRaw('COALESCE(sale_price, price) <= ?', [$filters['max_price']]);
        }

        $rawSort = $filters['sort'] ?? 'latest';
        $type = $filters['type'] ?? null;

        // Hỗ trợ link cũ từ HomePage: /products?sort=featured
        if (!$type && in_array($rawSort, ['featured', 'sale', 'best_selling', 'latest'], true)) {
            $type = $rawSort;
            $rawSort = $rawSort === 'best_selling' ? 'best_selling' : 'latest';
        }

        $type = $type ?: 'latest';

        match ($type) {
            'featured' => $query->where('is_hot', 1),

            'sale' => $query
                ->whereNotNull('sale_price')
                ->whereColumn('sale_price', '<', 'price'),

            default => null,
        };

        match ($rawSort) {
            'best_selling' => $query
                ->orderByDesc('sold_quantity')
                ->orderByDesc('id'),

            'price_asc' => $query
                ->orderByRaw('COALESCE(sale_price, price) ASC')
                ->orderByDesc('id'),

            'price_desc' => $query
                ->orderByRaw('COALESCE(sale_price, price) DESC')
                ->orderByDesc('id'),

            default => $query
                ->orderByDesc('id'),
        };

        $limit = $filters['limit'] ?? 24;

        return $query->paginate($limit);
    }
    public function getDetail(int $id): Product
    {
        return Product::with(['farm', 'category', 'images', 'certificate.certification'])
            ->withCount([
                'completedOrderItems as order_count',
                'visibleRatingReviews as review_count',
                'visibleComments as comment_count',
                'visibleReviewReplies as reply_comment_count',
            ])
            ->withSum('completedOrderItems as sold_quantity', 'quantity')
            ->withAvg('visibleRatingReviews as rating_avg', 'rating')
            ->where('status', 1)
            ->whereHas('farm', function ($farmQuery) {
                $farmQuery->where('status', Farm::STATUS_ACTIVE);
            })
            ->whereHas('certificate')
            ->findOrFail($id);
    }

    public function getVendorProducts(array $filters, int $sellerId): array
    {
        $farm = $this->getSellerFarm($sellerId);

        $query = Product::with([
            'farm',
            'category',
            'images',
            'approver:id,name,email',
            'adminLocker:id,name,email',
            'certificates.certification',
            'certificates.approver:id,name,email',
        ])
            ->where('farm_id', $farm->id);

        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('slug', 'like', "%{$keyword}%");
            });
        }

        if (isset($filters['category_id']) && $filters['category_id'] !== '') {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $status = (string) $filters['status'];

            if ($status === 'expired_certificate') {
                // Product đang Active nhưng chứng chỉ Approved đã hết hạn
                // và không có chứng chỉ Approved còn hạn
                $query->where('status', 1)
                    ->whereHas('certificates', function ($q) {
                        $q->where('status', 1)
                            ->whereDate('expiry_date', '<', today());
                    })
                    ->whereDoesntHave('certificate');
            } elseif ($status === '1') {
                // Đang bán thật sự = product active + chứng chỉ approved còn hạn
                $query->where('status', 1)
                    ->whereHas('certificate');
            } else {
                $query->where('status', (int) $status);
            }
        }

        $perPage = (int) ($filters['per_page'] ?? 8);

        $products = $query
            ->orderByDesc('id')
            ->paginate($perPage);

        return [
            'stats' => [
                'total_products' => Product::where('farm_id', $farm->id)->count(),

                // Đang bán thật sự = product active + chứng chỉ approved còn hạn
                'active_products' => Product::where('farm_id', $farm->id)
                    ->where('status', 1)
                    ->whereHas('certificate')
                    ->count(),

                'pending_products' => Product::where('farm_id', $farm->id)
                    ->where('status', 0)
                    ->count(),

                'hidden_products' => Product::where('farm_id', $farm->id)
                    ->where('status', 3)
                    ->count(),

                'expired_certificate_products' => Product::where('farm_id', $farm->id)
                    ->where('status', 1)
                    ->whereHas('certificates', function ($q) {
                        $q->where('status', 1)
                            ->whereDate('expiry_date', '<', today());
                    })
                    ->whereDoesntHave('certificate')
                    ->count(),
            ],

            'products' => collect($products->items())
                ->map(fn($product) => $this->formatVendorProduct($product))
                ->values(),

            'pagination' => [
                'current_page' => $products->currentPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'last_page' => $products->lastPage(),
                'from' => $products->firstItem(),
                'to' => $products->lastItem(),
            ],
        ];
    }

    public function getVendorProductDetail(int $productId, int $sellerId): array
    {
        $farm = $this->getSellerFarm($sellerId);

        $product = Product::with([
            'farm',
            'category',
            'images',
            'approver:id,name,email',
            'adminLocker:id,name,email',
            'certificates.certification',
            'certificates.approver:id,name,email',
        ])
            ->where('id', $productId)
            ->where('farm_id', $farm->id)
            ->firstOrFail();

        return $this->formatVendorProduct($product, true);
    }

    public function createVendorProduct(array $data, int $sellerId): Product
    {
        $farm = $this->getActiveSellerFarm($sellerId);

        $data['name'] = trim($data['name']);

        $this->ensureProductNameNotExistsInFarm(
            farmId: $farm->id,
            name: $data['name']
        );

        return DB::transaction(function () use ($data, $farm) {
            $detailImages = $data['detail_images'] ?? [];

            unset($data['detail_images']);
            unset($data['stock_quantity']);
            unset($data['status']);

            $certificate = [
                'certification_id' => $data['certification_id'],
                'certificate_number' => $data['certificate_number'],
                'certificate_file' => $data['certificate_file'],
                'issued_date' => $data['issued_date'],
                'expiry_date' => $data['expiry_date'],
            ];

            unset(
                $data['certification_id'],
                $data['certificate_number'],
                $data['certificate_file'],
                $data['issued_date'],
                $data['expiry_date']
            );

            $data['farm_id'] = $farm->id;
            $data['slug'] = $this->generateUniqueSlug($data['name']);
            $data['stock_quantity'] = 0;
            $data['is_hot'] = $data['is_hot'] ?? 0;

            // 0 = Chờ duyệt
            $data['status'] = 0;

            $product = Product::create($data);

            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $product->thumbnail,
            ]);

            ProductCertificate::create([
                'product_id' => $product->id,
                'certification_id' => $certificate['certification_id'],
                'certificate_number' => $certificate['certificate_number'],
                'certificate_file' => $certificate['certificate_file'],
                'issued_date' => $certificate['issued_date'],
                'expiry_date' => $certificate['expiry_date'],

                // 0 = Chờ duyệt
                'status' => 0,
            ]);

            foreach ($detailImages as $imageUrl) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_url' => $imageUrl,
                ]);
            }

            return $product->load(['farm', 'category', 'images', 'certificates.certification']);
        });
    }

    public function updateVendorProduct(array $data, int $productId, int $sellerId): Product
    {
        $product = $this->findSellerProductForMutation($productId, $sellerId);

        $finalPrice = $data['price'] ?? $product->price;

        $finalSalePrice = array_key_exists('sale_price', $data)
            ? $data['sale_price']
            : $product->sale_price;

        if ($finalSalePrice !== null && (float) $finalSalePrice > (float) $finalPrice) {
            throw ValidationException::withMessages([
                'sale_price' => ['Giá khuyến mãi không được lớn hơn giá gốc.'],
            ]);
        }

        if (isset($data['name'])) {
            $data['name'] = trim($data['name']);

            $this->ensureProductNameNotExistsInFarm(
                farmId: $product->farm_id,
                name: $data['name'],
                ignoreId: $product->id
            );

            $data['slug'] = $this->generateUniqueSlug($data['name'], $product->id);
        }

        return DB::transaction(function () use ($data, $product) {
            unset($data['stock_quantity']);
            unset($data['status']);

            // Không xử lý chứng chỉ trong update sản phẩm
            unset(
                $data['product_certificate_id'],
                $data['certification_id'],
                $data['certificate_number'],
                $data['certificate_file'],
                $data['issued_date'],
                $data['expiry_date']
            );

            $hasDetailImages = array_key_exists('detail_images', $data);
            $detailImages = $data['detail_images'] ?? [];
            unset($data['detail_images']);

            $oldThumbnail = $product->thumbnail;

            // Seller sửa thông tin sản phẩm thì đưa về chờ duyệt lại
            if (in_array((int) $product->status, [1, 2, 3], true)) {
                $data['status'] = 0;
            }

            $product->update($data);

            $firstImage = $product->images()
                ->orderBy('id')
                ->first();

            if (!$firstImage) {
                $firstImage = ProductImage::create([
                    'product_id' => $product->id,
                    'image_url' => $product->thumbnail,
                ]);
            }

            if (isset($data['thumbnail']) && $product->thumbnail !== $oldThumbnail) {
                $firstImage->update([
                    'image_url' => $product->thumbnail,
                ]);
            }

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

            return $product->fresh(['farm', 'category', 'images', 'certificates.certification']);
        });
    }

    public function deleteVendorProduct(int $productId, int $sellerId): void
    {
        $product = $this->findSellerProductForMutation($productId, $sellerId);

        $product->delete();
    }

    public function toggleVendorProductStatus(int $productId, int $sellerId): array
    {
        $product = $this->findSellerProductForMutation($productId, $sellerId);

        if ($product->admin_locked_at) {
            throw ValidationException::withMessages([
                'status' => [
                    'Sản phẩm đang bị quản trị viên đình chỉ. Người bán không thể tự mở lại.',
                ],
            ]);
        }

        $currentStatus = (int) $product->status;

        if (!in_array($currentStatus, [1, 3], true)) {
            throw ValidationException::withMessages([
                'status' => ['Chỉ sản phẩm đang bán hoặc tạm ẩn mới được ẩn/hiện.'],
            ]);
        }

        // Nếu đang tạm ẩn và muốn hiện lại, bắt buộc phải có chứng chỉ approved còn hạn
        if ($currentStatus === 3) {
            $hasValidCertificate = ProductCertificate::where('product_id', $product->id)
                ->where('status', 1)
                ->where('expiry_date', '>=', today())
                ->exists();

            if (!$hasValidCertificate) {
                throw ValidationException::withMessages([
                    'certificate' => ['Không thể hiện sản phẩm vì chứng chỉ đã hết hạn hoặc chưa được duyệt.'],
                ]);
            }
        }

        $product->update([
            'status' => $currentStatus === 1 ? 3 : 1,
        ]);

        return $this->formatVendorProduct(
            $product->fresh(['farm', 'category', 'images', 'certificates.certification'])
        );
    }

    public function renewVendorProductCertificate(array $data, int $productId, int $sellerId): ProductCertificate
    {
        $product = $this->findSellerProductForMutation($productId, $sellerId);

        if (!in_array((int) $product->status, [1, 3], true)) {
            throw ValidationException::withMessages([
                'product' => ['Chỉ sản phẩm đã được duyệt mới được gia hạn chứng chỉ.'],
            ]);
        }

        $renewableCertificate = ProductCertificate::where('product_id', $product->id)
            ->whereIn('status', [1, 3])
            ->orderByDesc('id')
            ->first();

        if (!$renewableCertificate) {
            throw ValidationException::withMessages([
                'certificate' => ['Sản phẩm chưa có chứng chỉ để gia hạn.'],
            ]);
        }

        $hasPendingCertificate = ProductCertificate::where('product_id', $product->id)
            ->where('status', 0)
            ->exists();

        if ($hasPendingCertificate) {
            throw ValidationException::withMessages([
                'certificate' => ['Sản phẩm đang có chứng chỉ chờ duyệt, không thể gửi gia hạn mới.'],
            ]);
        }

        return DB::transaction(function () use ($product, $data, $renewableCertificate) {
            return ProductCertificate::create([
                'product_id' => $product->id,

                // Không lấy certification_id từ FE.
                // Luôn dùng đúng loại chứng chỉ cũ.
                'certification_id' => $renewableCertificate->certification_id,

                'certificate_number' => $data['certificate_number'],
                'certificate_file' => $data['certificate_file'],
                'issued_date' => $data['issued_date'],
                'expiry_date' => $data['expiry_date'],

                'status' => 0,
            ])->load('certification');
        });
    }

    public function resubmitRejectedCertificate(
        array $data,
        int $productId,
        int $sellerId
    ): ProductCertificate {
        $product = $this->findSellerProductForMutation($productId, $sellerId);

        if (!in_array((int) $product->status, [0, 2], true)) {
            throw ValidationException::withMessages([
                'product' => [
                    'Chỉ sản phẩm chờ duyệt hoặc bị từ chối mới được sửa hồ sơ chứng chỉ.'
                ],
            ]);
        }

        $rejectedCertificate = ProductCertificate::query()
            ->where('product_id', $product->id)
            ->where('status', 2)
            ->latest('id')
            ->first();

        if (!$rejectedCertificate) {
            throw ValidationException::withMessages([
                'certificate' => [
                    'Không tìm thấy hồ sơ chứng chỉ bị từ chối để gửi lại.'
                ],
            ]);
        }

        $hasPendingCertificate = ProductCertificate::query()
            ->where('product_id', $product->id)
            ->where('status', 0)
            ->exists();

        if ($hasPendingCertificate) {
            throw ValidationException::withMessages([
                'certificate' => [
                    'Sản phẩm đang có hồ sơ chờ duyệt, không thể gửi thêm hồ sơ mới.'
                ],
            ]);
        }

        return DB::transaction(function () use ($product, $data, $rejectedCertificate) {
            $certificate = ProductCertificate::create([
                'product_id' => $product->id,
                'certification_id' => $rejectedCertificate->certification_id,
                'certificate_number' => $data['certificate_number'],
                'certificate_file' => $data['certificate_file'],
                'issued_date' => $data['issued_date'],
                'expiry_date' => $data['expiry_date'],
                'status' => 0,
            ]);

            $product->update([
                'status' => 0,
                'approved_by' => null,
                'approved_at' => null,
                'rejection_reason' => null,
            ]);

            return $certificate->load(['certification', 'approver']);
        });
    }

    private function getSellerFarm(int $sellerId): Farm
    {
        $farm = Farm::where('seller_id', $sellerId)->first();

        if (!$farm) {
            abort(403, 'Tài khoản người bán chưa có gian hàng');
        }

        return $farm;
    }

    private function getActiveSellerFarm(int $sellerId): Farm
    {
        $farm = $this->getSellerFarm($sellerId);

        if ($farm->trashed() || (int) $farm->status !== Farm::STATUS_ACTIVE) {
            throw ValidationException::withMessages([
                'farm' => [
                    'Gian hàng phải đang hoạt động mới được thay đổi sản phẩm hoặc chứng chỉ. Bạn vẫn có thể xử lý các đơn hàng đã phát sinh.'
                ],
            ]);
        }

        return $farm;
    }

    private function findSellerProduct(int $productId, int $sellerId): Product
    {
        $farm = $this->getSellerFarm($sellerId);

        return Product::where('id', $productId)
            ->where('farm_id', $farm->id)
            ->firstOrFail();
    }

    private function findSellerProductForMutation(int $productId, int $sellerId): Product
    {
        $farm = $this->getActiveSellerFarm($sellerId);

        return Product::query()
            ->where('id', $productId)
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

    private function formatVendorProduct(Product $product, bool $isDetail = false): array
    {
        $currentCertificate = $product->certificates
            ->where('status', 1)
            ->filter(function ($certificate) {
                return $certificate->expiry_date && $certificate->expiry_date->gte(today());
            })
            ->sortByDesc('id')
            ->first();

        $expiredCertificate = $product->certificates
            ->where('status', 1)
            ->filter(function ($certificate) {
                return $certificate->expiry_date && $certificate->expiry_date->lt(today());
            })
            ->sortByDesc('id')
            ->first();

        $pendingCertificate = $product->certificates
            ->where('status', 0)
            ->sortByDesc('id')
            ->first();

        $rejectedCertificate = $product->certificates
            ->where('status', 2)
            ->sortByDesc('id')
            ->first();

        // Chứng chỉ dùng để gia hạn: còn hạn hoặc đã hết hạn
        $renewableCertificate = $currentCertificate ?: $expiredCertificate;

        // Hiển thị ngoài bảng: ưu tiên pending, rồi current, rồi expired
        $latestCertificate = $pendingCertificate
            ?: ($currentCertificate ?: ($expiredCertificate ?: $rejectedCertificate));

        $statusText = $this->getProductStatusText((int) $product->status);
        $statusClass = $this->getProductStatusClass((int) $product->status);

        $isCertificateExpired = false;
        $isSellable = false;
        $farmIsPublic = $product->farm
            && !$product->farm->trashed()
            && (int) $product->farm->status === Farm::STATUS_ACTIVE;

        if ((int) $product->status === 1) {
            if ($currentCertificate && $farmIsPublic) {
                $isSellable = true;
                $statusText = 'Đang bán';
                $statusClass = 'active';
            } elseif ($currentCertificate) {
                $statusText = 'Nông trại chưa hoạt động';
                $statusClass = 'pending';
            } elseif ($pendingCertificate && $expiredCertificate) {
                $statusText = 'Chờ duyệt gia hạn';
                $statusClass = 'pending';
                $isCertificateExpired = true;
            } elseif ($expiredCertificate) {
                $statusText = 'Hết hạn chứng chỉ';
                $statusClass = 'danger';
                $isCertificateExpired = true;
            } else {
                $statusText = 'Chưa có chứng chỉ hợp lệ';
                $statusClass = 'danger';
            }
        }

        $data = [
            'id' => $product->id,
            'code' => 'SP' . str_pad($product->id, 6, '0', STR_PAD_LEFT),

            'farm_id' => $product->farm_id,
            'category_id' => $product->category_id,
            'category_name' => $product->category?->name,

            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,

            'price' => (float) $product->price,
            'price_text' => $this->formatMoney($product->price),

            'sale_price' => $product->sale_price !== null ? (float) $product->sale_price : null,
            'sale_price_text' => $product->sale_price !== null
                ? $this->formatMoney($product->sale_price)
                : null,

            'stock_quantity' => (float) $product->stock_quantity,
            'unit' => $product->unit,

            'thumbnail' => $product->thumbnail,
            'is_hot' => (bool) $product->is_hot,

            // status DB
            'status' => (int) $product->status,

            // status hiển thị theo nghiệp vụ
            'status_text' => $statusText,
            'status_class' => $statusClass,

            'reviewed_by' => $product->approver ? [
                'id' => $product->approver->id,
                'name' => $product->approver->name,
                'email' => $product->approver->email,
            ] : null,
            'reviewed_at' => optional($product->approved_at)->format('d/m/Y H:i'),
            'rejection_reason' => $product->rejection_reason,
            'admin_locked_at' => optional($product->admin_locked_at)->format('d/m/Y H:i'),
            'admin_lock_reason' => $product->admin_lock_reason,
            'admin_locker' => $product->adminLocker ? [
                'id' => $product->adminLocker->id,
                'name' => $product->adminLocker->name,
                'email' => $product->adminLocker->email,
            ] : null,

            'is_sellable' => $isSellable,
            'is_certificate_expired' => $isCertificateExpired,

            // Chứng chỉ còn hạn đang dùng
            'current_certificate' => $currentCertificate
                ? $this->formatCertificate($currentCertificate)
                : null,

            // Giữ alias cũ cho FE nếu đang dùng
            'approved_certificate' => $currentCertificate
                ? $this->formatCertificate($currentCertificate)
                : null,

            // Chứng chỉ đã hết hạn
            'expired_certificate' => $expiredCertificate
                ? $this->formatCertificate($expiredCertificate)
                : null,

            // Chứng chỉ đang chờ duyệt gia hạn
            'pending_certificate' => $pendingCertificate
                ? $this->formatCertificate($pendingCertificate)
                : null,

            'rejected_certificate' => $rejectedCertificate
                ? $this->formatCertificate($rejectedCertificate)
                : null,

            // Chứng chỉ dùng để biết loại gia hạn
            'renewable_certificate' => $renewableCertificate
                ? $this->formatCertificate($renewableCertificate)
                : null,

            'latest_certificate' => $latestCertificate
                ? $this->formatCertificate($latestCertificate)
                : null,

            'updated_at' => optional($product->updated_at)->format('d/m/Y H:i'),
            'created_at' => optional($product->created_at)->format('d/m/Y H:i'),
        ];

        if ($isDetail) {
            $data['images'] = $product->images->map(function ($image) {
                return [
                    'id' => $image->id,
                    'image_url' => $image->image_url,
                ];
            })->values();

            $data['certificates'] = $product->certificates
                ->sortByDesc('id')
                ->map(fn($certificate) => $this->formatCertificate($certificate))
                ->values();
        }

        return $data;
    }

    private function formatCertificate(ProductCertificate $certificate): array
    {
        $isExpired = (int) $certificate->status === 1
            && $certificate->expiry_date
            && $certificate->expiry_date->lt(today());

        return [
            'id' => $certificate->id,
            'certification_id' => $certificate->certification_id,
            'certification_name' => $certificate->certification?->name,
            'certificate_number' => $certificate->certificate_number,
            'certificate_file' => $certificate->certificate_file,
            'issued_date' => optional($certificate->issued_date)->format('Y-m-d'),
            'expiry_date' => optional($certificate->expiry_date)->format('Y-m-d'),

            // status trong DB vẫn giữ nguyên
            'status' => (int) $certificate->status,

            // status hiển thị
            'status_text' => $isExpired
                ? 'Hết hạn'
                : $this->getCertificateStatusText((int) $certificate->status),

            'status_class' => $isExpired
                ? 'danger'
                : $this->getCertificateStatusClass((int) $certificate->status),

            'is_expired' => $isExpired,
            'reviewed_by' => $certificate->approver ? [
                'id' => $certificate->approver->id,
                'name' => $certificate->approver->name,
                'email' => $certificate->approver->email,
            ] : null,
            'reviewed_at' => optional($certificate->approved_at)->format('d/m/Y H:i'),
            'rejection_reason' => $certificate->rejection_reason,
        ];
    }

    private function formatMoney($amount): string
    {
        return number_format((float) $amount, 0, ',', '.') . ' đ';
    }

    private function getProductStatusText(int $status): string
    {
        return match ($status) {
            0 => 'Chờ duyệt',
            1 => 'Đang bán',
            2 => 'Từ chối',
            3 => 'Tạm ẩn',
            default => 'Không xác định',
        };
    }

    private function getProductStatusClass(int $status): string
    {
        return match ($status) {
            0 => 'pending',
            1 => 'active',
            2 => 'danger',
            3 => 'hidden',
            default => 'pending',
        };
    }

    private function getCertificateStatusText(int $status): string
    {
        return match ($status) {
            0 => 'Chờ duyệt',
            1 => 'Đã duyệt',
            2 => 'Từ chối',
            3 => 'Hết hạn',
            4 => 'Thay thế',
            default => 'Không xác định',
        };
    }
    private function getCertificateStatusClass(int $status): string
    {
        return match ($status) {
            0 => 'pending',
            1 => 'active',
            2 => 'danger',
            3 => 'danger',
            4 => 'hidden',
            default => 'pending',
        };
    }

    private function extractVendorProductId(string $keyword): ?int
    {
        $normalized = strtoupper(preg_replace('/\s+/', '', $keyword));

        if (!preg_match('/^SP0*(\d+)$/', $normalized, $matches)) {
            return null;
        }

        $id = (int) $matches[1];

        return $id > 0 ? $id : null;
    }

    public function getPublicProductDetailBySlug(string $slug): Product
    {
        $query = Product::query()
            ->with([
                'farm',
                'category',
                'certificate.certification',
            ])
            ->withCount([
                'completedOrderItems as order_count',
                'visibleRatingReviews as review_count',
                'visibleComments as comment_count',
                'visibleReviewReplies as reply_comment_count',
            ])
            ->withSum('completedOrderItems as sold_quantity', 'quantity')
            ->withAvg('visibleRatingReviews as rating_avg', 'rating')
            ->where('status', 1)
            ->whereHas('farm', function ($farmQuery) {
                $farmQuery->where('status', Farm::STATUS_ACTIVE);
            })
            ->whereHas('certificate');

        if (method_exists(Product::class, 'images')) {
            $query->with('images');
        }

        return $query
            ->where('slug', $slug)
            ->firstOrFail();
    }

    public function getPublicProductDetail(int $id)
    {
        $query = Product::query()
            ->with([
                'farm',
                'category',
                'certificate.certification',
            ])
            ->withCount([
                'completedOrderItems as order_count',
                'visibleRatingReviews as review_count',
                'visibleComments as comment_count',
                'visibleReviewReplies as reply_comment_count',
            ])
            ->withSum('completedOrderItems as sold_quantity', 'quantity')
            ->withAvg('visibleRatingReviews as rating_avg', 'rating')
            ->where('status', 1)
            ->whereHas('farm', function ($farmQuery) {
                $farmQuery->where('status', Farm::STATUS_ACTIVE);
            })
            ->whereHas('certificate');

        if (method_exists(Product::class, 'images')) {
            $query->with('images');
        }

        return $query->findOrFail($id);
    }

    public function getPublicProductReviews($product, int $page = 1, int $limit = 5)
    {
        if (!$product instanceof Product) {
            $product = $this->getPublicProductDetail((int) $product);
        }

        return $product->visibleReviews()
            ->with([
                'orderItem.subOrder.order.user',
                'user:id,name,email,avatar',
                'user.roles',
                'replies' => function ($query) {
                    $query->where('status', 1)->with('user.roles');
                },
            ])
            ->latest('reviews.created_at')
            ->paginate($limit, ['reviews.*'], 'page', $page);
    }

    public function getRelatedPublicProducts(Product $product, int $limit = 8)
    {
        return Product::query()
            ->with(['farm', 'category', 'certificate.certification'])
            ->withCount([
                'completedOrderItems as order_count',
                'visibleRatingReviews as review_count',
                'visibleComments as comment_count',
                'visibleReviewReplies as reply_comment_count',
            ])
            ->withSum('completedOrderItems as sold_quantity', 'quantity')
            ->withAvg('visibleRatingReviews as rating_avg', 'rating')
            ->where('status', 1)
            ->whereHas('farm', function ($farmQuery) {
                $farmQuery->where('status', Farm::STATUS_ACTIVE);
            })
            ->whereHas('certificate')

            // Không lấy chính sản phẩm đang xem
            ->where('id', '!=', $product->id)

            // Quan trọng:
            // Dù đi từ category cha vào,
            // related vẫn lấy theo category_id thật của sản phẩm
            ->where('category_id', $product->category_id)

            ->latest()
            ->limit($limit)
            ->get();
    }
}
