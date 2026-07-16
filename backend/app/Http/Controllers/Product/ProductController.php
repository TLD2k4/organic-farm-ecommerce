<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\RenewProductCertificateRequest;
use App\Http\Requests\Product\StoreVendorProductRequest;
use App\Http\Requests\Product\UpdateVendorProductRequest;
use App\Models\Category;
use App\Models\Certification;
use App\Services\Product\ProductService;
use Illuminate\Http\Request;
use App\Models\Farm;
use App\Models\Product;
use App\Models\User;
use App\Notifications\MarketplaceNotification;
use App\Services\Farm\SellerPolicyAccessService;

class ProductController extends Controller
{
    public function __construct(
        private ProductService $productService,
        private SellerPolicyAccessService $sellerPolicyAccessService,
    ) {}

    public function index(Request $request)
    {
        $filters = $request->validate([
            'vendor_id' => ['nullable', 'integer', 'exists:farms,id'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'category_slug' => ['nullable', 'string', 'max:100', 'exists:categories,slug'],
            'certification_id' => ['nullable', 'integer', 'exists:certifications,id'],

            'keyword' => ['nullable', 'string', 'max:100'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],

            'type' => ['nullable', 'string', 'in:latest,best_selling,featured,sale'],
            'sort' => ['nullable', 'string', 'in:latest,best_selling,featured,sale,price_asc,price_desc'],

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

    public function show(Request $request, string $slug)
    {
        $product = $this->productService->getPublicProductDetailBySlug($slug);

        $reviewLimit = (int) $request->query('reviews_limit', 5);
        $reviewLimit = max(1, min($reviewLimit, 20));

        $reviewsPaginator = $this->productService->getPublicProductReviews(
            $product,
            1,
            $reviewLimit
        );

        $relatedProducts = $this->productService->getRelatedPublicProducts($product);

        $formattedReviews = $this->formatReviewsPaginator($reviewsPaginator);

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết sản phẩm thành công',
            'data' => [
                ...$this->formatProductDetail($product),

                'reviews' => $formattedReviews['data'],
                'reviews_meta' => $formattedReviews['meta'],

                'related_products' => $relatedProducts
                    ->map(fn($item) => $this->formatProduct($item))
                    ->values(),
            ],
        ]);
    }

    public function reviews(Request $request, $id)
    {
        $page = (int) $request->query('page', 1);
        $limit = (int) $request->query('limit', 5);

        $page = max(1, $page);
        $limit = max(1, min($limit, 20));

        $product = $this->productService->getPublicProductDetail((int) $id);

        $reviewsPaginator = $this->productService->getPublicProductReviews(
            $product,
            $page,
            $limit
        );

        $formattedReviews = $this->formatReviewsPaginator($reviewsPaginator);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đánh giá thành công',
            'data' => $formattedReviews['data'],
            'meta' => $formattedReviews['meta'],
        ]);
    }
    public function vendorOptions(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'categories' => Category::select('id', 'name')
                    ->orderBy('name')
                    ->get(),

                'certifications' => Certification::select('id', 'name')
                    ->orderBy('name')
                    ->get(),
            ],
        ]);
    }

    public function vendorIndex(Request $request)
    {
        $filters = $request->validate([
            'keyword' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'status' => ['nullable', 'string', 'in:0,1,2,3,expired_certificate'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $data = $this->productService->getVendorProducts(
            filters: $filters,
            sellerId: (int) $request->user()->getAuthIdentifier()
        );

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function vendorShow(Request $request, int $id)
    {
        $product = $this->productService->getVendorProductDetail(
            productId: $id,
            sellerId: (int) $request->user()->getAuthIdentifier()
        );

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    public function storeVendorProduct(StoreVendorProductRequest $request)
    {
        $product = $this->productService->createVendorProduct(
            data: $request->validated(),
            sellerId: (int) $request->user()->getAuthIdentifier()
        );
        $this->notifyAdmins(
            $request, 'product.submitted', 'Sản phẩm mới chờ duyệt',
            'Sản phẩm ' . $product->name . ' vừa được gửi duyệt.',
            $product->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Thêm sản phẩm mới thành công. Sản phẩm đang chờ duyệt.',
            'id' => $product->id,
            'data' => $product,
        ], 201);
    }

    public function updateVendorProduct(UpdateVendorProductRequest $request, int $id)
    {
        $product = $this->productService->updateVendorProduct(
            data: $request->validated(),
            productId: $id,
            sellerId: (int) $request->user()->getAuthIdentifier()
        );
        $this->notifyAdmins(
            $request, 'product.resubmitted', 'Sản phẩm chờ duyệt lại',
            'Sản phẩm ' . $product->name . ' vừa được cập nhật.',
            $product->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật sản phẩm thành công. Sản phẩm đang chờ duyệt lại.',
            'id' => $product->id,
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

    public function toggleVendorProductStatus(Request $request, int $id)
    {
        $product = $this->productService->toggleVendorProductStatus(
            productId: $id,
            sellerId: (int) $request->user()->getAuthIdentifier()
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái sản phẩm thành công.',
            'data' => $product,
        ]);
    }

    public function renewVendorProductCertificate(RenewProductCertificateRequest $request, int $id)
    {
        $certificate = $this->productService->renewVendorProductCertificate(
            data: $request->validated(),
            productId: $id,
            sellerId: (int) $request->user()->getAuthIdentifier()
        );
        $this->notifyAdmins(
            $request, 'certificate.renewal_submitted',
            'Chứng chỉ gia hạn chờ duyệt',
            'Có hồ sơ gia hạn chứng chỉ mới cho sản phẩm #' . $id . '.',
            $id
        );

        return response()->json([
            'success' => true,
            'message' => 'Gửi yêu cầu gia hạn chứng chỉ thành công. Vui lòng chờ quản trị viên duyệt.',
            'data' => [
                'id' => $certificate->id,
                'product_id' => $certificate->product_id,
                'certification_id' => $certificate->certification_id,
                'certification_name' => $certificate->certification?->name,
                'certificate_number' => $certificate->certificate_number,
                'certificate_file' => $certificate->certificate_file,
                'issued_date' => optional($certificate->issued_date)->format('Y-m-d'),
                'expiry_date' => optional($certificate->expiry_date)->format('Y-m-d'),
                'status' => (int) $certificate->status,
                'status_text' => 'Chờ duyệt',
            ],
        ], 201);
    }

    public function resubmitRejectedCertificate(RenewProductCertificateRequest $request, int $id)
    {
        $certificate = $this->productService->resubmitRejectedCertificate(
            data: $request->validated(),
            productId: $id,
            sellerId: (int) $request->user()->getAuthIdentifier()
        );
        $this->notifyAdmins(
            $request, 'certificate.resubmitted',
            'Chứng chỉ được gửi duyệt lại',
            'Seller đã sửa và gửi lại chứng chỉ cho sản phẩm #' . $id . '.',
            $id
        );

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi lại hồ sơ chứng chỉ. Sản phẩm đang chờ quản trị viên duyệt.',
            'data' => [
                'id' => $certificate->id,
                'product_id' => $certificate->product_id,
                'certification_id' => $certificate->certification_id,
                'certification_name' => $certificate->certification?->name,
                'certificate_number' => $certificate->certificate_number,
                'certificate_file' => $certificate->certificate_file,
                'issued_date' => optional($certificate->issued_date)->format('Y-m-d'),
                'expiry_date' => optional($certificate->expiry_date)->format('Y-m-d'),
                'status' => (int) $certificate->status,
                'status_text' => 'Chờ duyệt',
            ],
        ], 201);
    }

    private function notifyAdmins(
        Request $request,
        string $eventType,
        string $title,
        string $message,
        int $productId
    ): void {
        User::role('admin')->each(function (User $admin) use (
            $request,
            $eventType,
            $title,
            $message,
            $productId
        ) {
            if ((int) $admin->id === (int) $request->user()->id) {
                return;
            }

            $admin->notify(new MarketplaceNotification(
                $eventType,
                $title,
                $message,
                '/admin/products',
                $request->user(),
                ['product_id' => $productId]
            ));
        });
    }

    private function formatProduct($product, bool $isDetail = false): array
    {
        $orderAvailability = $this->sellerPolicyAccessService
            ->availability($product->farm);
        $price = (float) $product->price;

        $salePrice = $product->sale_price !== null
            ? (float) $product->sale_price
            : null;

        $finalPrice = $salePrice && $salePrice < $price
            ? $salePrice
            : $price;

        $discountPercent = null;

        if ($salePrice && $salePrice < $price && $price > 0) {
            $discountPercent = (int) round((($price - $salePrice) / $price) * 100);
        }

        $reviewCount = (int) ($product->review_count ?? 0);

        $rating = $reviewCount > 0 && $product->rating_avg !== null
            ? round((float) $product->rating_avg, 1)
            : null;

        $soldQuantity = (float) ($product->sold_quantity ?? 0);

        $data = [
            'id' => $product->id,
            'farm_id' => $product->farm_id,
            'category_id' => $product->category_id,

            'name' => $product->name,
            'slug' => $product->slug,

            'price' => $price,
            'price_text' => $this->formatMoney($price),

            'sale_price' => $salePrice,
            'sale_price_text' => $salePrice !== null
                ? $this->formatMoney($salePrice)
                : null,

            'final_price' => $finalPrice,
            'final_price_text' => $this->formatMoney($finalPrice),

            'discount_percent' => $discountPercent,

            'stock_quantity' => (float) $product->stock_quantity,
            'unit' => $product->unit,

            'thumbnail' => $product->thumbnail,
            'thumbnail_url' => $product->thumbnail,

            'is_hot' => (bool) $product->is_hot,
            'status' => (int) $product->status,
            'accepting_orders' => $orderAvailability['accepting_orders'],
            'order_unavailable_reason' => $orderAvailability['reason'],
            'required_policy_version' => $orderAvailability['policy_version'],

            'rating' => $rating,
            'rating_avg' => $rating,
            'review_count' => $reviewCount,
            'comment_count' => (int) ($product->comment_count ?? 0),

            'order_count' => (int) ($product->order_count ?? 0),
            'sold_quantity' => $soldQuantity,
            'sold_count' => $soldQuantity,

            'farm' => $product->farm ? [
                'id' => $product->farm->id,
                'seller_id' => $product->farm->seller_id,
                'name' => $product->farm->name,
                'slug' => $product->farm->slug,
                'logo' => $product->farm->logo,
                'address' => $product->farm->address,
                'accepting_orders' => $orderAvailability['accepting_orders'],
                'order_unavailable_reason' => $orderAvailability['reason'],
            ] : null,

            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
                'slug' => $product->category->slug,
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

            $data['certificate'] = $product->certificate ? [
                'id' => $product->certificate->id,
                'certification_id' => $product->certificate->certification_id,
                'certification_name' => $product->certificate->certification?->name,
                'certificate_number' => $product->certificate->certificate_number,
                'certificate_file' => $product->certificate->certificate_file,
                'issued_date' => $product->certificate->issued_date,
                'expiry_date' => $product->certificate->expiry_date,
            ] : null;
        }

        return $data;
    }

    private function formatMoney(float $amount): string
    {
        return number_format($amount, 0, ',', '.') . 'đ';
    }

    public function filters()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'categories' => Category::query()
                    ->where('status', 1)
                    ->whereNull('parent_id')
                    ->withCount([
                        'products as products_count' => function ($q) {
                            $q->where('status', 1)
                                ->whereHas('certificate');
                        },
                    ])
                    ->with([
                        'children' => function ($q) {
                            $q->where('status', 1)
                                ->withCount([
                                    'products as products_count' => function ($p) {
                                        $p->where('status', 1)
                                            ->whereHas('certificate');
                                    },
                                ])
                                ->orderBy('name');
                        },
                    ])
                    ->orderBy('name')
                    ->get(),

                'farms' => Farm::query()
                    ->where('status', 1)
                    ->withCount([
                        'products as products_count' => function ($q) {
                            $q->where('status', 1)
                                ->whereHas('certificate');
                        },
                    ])
                    ->having('products_count', '>', 0)
                    ->orderBy('name')
                    ->get(['id', 'name', 'slug', 'address']),

                'certifications' => Certification::query()
                    ->select('id', 'name')
                    ->orderBy('name')
                    ->get(),
            ],
        ]);
    }
    private function formatProductDetail(Product $product): array
    {
        $base = $this->formatProduct($product);

        $certification = $product->certificate?->certification;

        return [
            ...$base,

            'description' => $product->description,

            'certification_name' => $certification?->name,

            'certificate' => $product->certificate ? [
                'id' => $product->certificate->id,
                'certification_id' => $product->certificate->certification_id,
                'certification_name' => $certification?->name,
                'certificate_number' => $product->certificate->certificate_number,
                'certificate_file' => $product->certificate->certificate_file,
                'issued_date' => $product->certificate->issued_date,
                'expiry_date' => $product->certificate->expiry_date,
                'certification' => $certification ? [
                    'id' => $certification->id,
                    'name' => $certification->name,
                ] : null,
            ] : null,

            'images' => $this->getProductImages($product, $base),
        ];
    }

    private function getProductImages(Product $product, array $base): array
    {
        $images = [];

        if (!empty($base['thumbnail_url'])) {
            $images[] = $base['thumbnail_url'];
        }

        if (!empty($base['image_url'])) {
            $images[] = $base['image_url'];
        }

        $rawImages = null;

        if ($product->relationLoaded('images')) {
            $rawImages = $product->getRelation('images');
        } else {
            $rawImages = $product->getAttribute('images')
                ?? $product->getAttribute('gallery')
                ?? [];
        }

        if (is_string($rawImages)) {
            $decoded = json_decode($rawImages, true);
            $rawImages = is_array($decoded) ? $decoded : [$rawImages];
        }

        if (is_iterable($rawImages)) {
            foreach ($rawImages as $image) {
                $url = null;

                if (is_string($image)) {
                    $url = $image;
                }

                if (is_array($image)) {
                    $url =
                        $image['url'] ??
                        $image['image_url'] ??
                        $image['thumbnail_url'] ??
                        $image['path'] ??
                        $image['image'] ??
                        null;
                }

                if (is_object($image)) {
                    $url =
                        $image->url ??
                        $image->image_url ??
                        $image->thumbnail_url ??
                        $image->path ??
                        $image->image ??
                        null;
                }

                $url = $this->normalizeImageUrl($url);

                if ($url) {
                    $images[] = $url;
                }
            }
        }

        return array_values(array_unique(array_filter($images)));
    }



    private function normalizeImageUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return asset('storage/' . ltrim($path, '/'));
    }

    private function formatReviewsPaginator($paginator): array
    {
        return [
            'data' => $paginator->getCollection()
                ->map(fn($review) => $this->formatReview($review))
                ->values(),

            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }

    private function formatReview($review): array
    {
        $user = $review->user ?: $review->orderItem?->subOrder?->order?->user;
        $isRatingReview = $review->order_item_id !== null
            && $review->rating !== null;
        $isAdminComment = !$isRatingReview && $user?->hasRole('admin');
        $isSellerComment = !$isRatingReview
            && !$isAdminComment
            && $user?->hasRole('seller');
        $isBuyerComment = !$isRatingReview
            && !$isAdminComment
            && !$isSellerComment;
        $entryType = match (true) {
            $isRatingReview => 'rating_review',
            $isAdminComment => 'admin_comment',
            $isSellerComment => 'seller_comment',
            default => 'buyer_comment',
        };

        return [
            'id' => $review->id,
            'rating' => $review->rating !== null ? (int) $review->rating : null,
            'entry_type' => $entryType,
            'entry_type_label' => match ($entryType) {
                'rating_review' => 'Đánh giá người mua',
                'admin_comment' => 'Bình luận quản trị',
                'seller_comment' => 'Bình luận người bán',
                default => 'Bình luận người mua',
            },
            'is_rating_review' => $entryType === 'rating_review',
            'is_admin_comment' => (bool) $isAdminComment,
            'is_seller_comment' => (bool) $isSellerComment,
            'is_buyer_comment' => (bool) $isBuyerComment,
            'comment' => $review->comment ?? $review->content ?? '',
            'created_at' => optional($review->created_at)->format('d/m/Y'),
            'user' => [
                'id' => $user?->id,
                'name' => $user?->name ?? 'Khách hàng',
                'avatar' => $this->normalizeImageUrl($user?->avatar),
            ],
            'replies' => $review->replies
                ->map(fn($reply) => [
                    'id' => $reply->id,
                    'comment' => $reply->comment,
                    'created_at' => optional($reply->created_at)->format('d/m/Y H:i'),
                    'user' => [
                        'id' => $reply->user?->id,
                        'name' => $reply->user?->name ?? 'Quản trị viên',
                        'roles' => $reply->user?->getRoleNames()->values() ?? [],
                    ],
                ])
                ->values(),
        ];
    }
}
