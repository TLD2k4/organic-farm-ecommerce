<?php

namespace App\Services\Home;

use App\Models\Category;
use App\Models\Farm;
use App\Models\Product;
use App\Models\Order;
use App\Models\Review;
use App\Services\Farm\SellerPolicyAccessService;

class HomeService
{
    private const NEW_PRODUCT_DAYS = 7;
    private const BEST_SELLER_DAYS = 30;
    private const BEST_SELLER_MIN_QUANTITY = 20;

    public function __construct(
        private SellerPolicyAccessService $sellerPolicyAccessService,
    ) {}

    public function getHomeData(array $filters = []): array
    {
        $categoryLimit = (int) ($filters['category_limit'] ?? 12);
        $productLimit = (int) ($filters['product_limit'] ?? 12);
        $farmLimit = (int) ($filters['farm_limit'] ?? 10);

        return [
            'hero' => $this->getHeroData(),

            'categories' => $this->getCategories($categoryLimit),

            'featured_products' => $this->getFeaturedProducts($productLimit),

            'best_selling_products' => $this->getBestSellingProducts($productLimit),

            'new_products' => $this->getNewProducts($productLimit),

            'sale_products' => $this->getSaleProducts($productLimit),

            'featured_farms' => $this->getFeaturedFarms($farmLimit),

            'stats' => $this->getStats(),
        ];
    }

    private function getHeroData(): array
    {
        return [
            'title' => 'Nông sản sạch cho cuộc sống xanh',
            'subtitle' => 'Sản phẩm hữu cơ, truy xuất nguồn gốc rõ ràng từ nông trại đến bàn ăn gia đình bạn.',
            'primary_button' => 'Mua ngay',
            'secondary_button' => 'Khám phá nông trại',
            'badges' => [
                [
                    'label' => '100%',
                    'text' => 'Hữu cơ',
                ],
                [
                    'label' => 'Freeship',
                    'text' => 'Từ 500K',
                ],
                [
                    'label' => '500+',
                    'text' => 'Nông trại',
                ],
            ],
        ];
    }

    private function getCategories(int $limit): array
    {
        return Category::query()
            ->where('status', 1)
            ->whereNull('parent_id')
            ->with([
                'children' => function ($query) {
                    $query->select(
                        'id',
                        'parent_id',
                        'name',
                        'slug',
                        'description',
                        'image',
                        'status'
                    )
                        ->where('status', 1)
                        ->orderBy('name');
                },
            ])
            ->withCount([
                'products as products_count' => function ($query) {
                    $query->publiclyVisible();
                },
            ])
            ->orderBy('id')
            ->limit($limit)
            ->get()
            ->map(fn($category) => $this->formatCategory($category))
            ->values()
            ->toArray();
    }

    private function baseProductQuery()
    {
        return Product::query()
            ->with([
                'farm:id,seller_id,name,slug,logo,address,status,deleted_at',
                'category:id,name,slug',
            ])
            ->withCount([
                'completedOrderItems as order_count',
                'visibleRatingReviews as review_count',
                'visibleComments as comment_count',
                'visibleReviewReplies as reply_comment_count',
            ])
            ->withSum('completedOrderItems as sold_quantity', 'quantity')
            ->withSum(
                [
                    'completedOrderItems as sold_quantity_30_days' =>
                    function ($query) {
                        $query->where(
                            'order_items.created_at',
                            '>=',
                            now()->subDays(self::BEST_SELLER_DAYS)
                        );
                    },
                ],
                'quantity'
            )
            ->withAvg('visibleRatingReviews as rating_avg', 'rating')
            ->publiclyVisible();
    }

    private function getFeaturedProducts(int $limit): array
    {
        return (clone $this->baseProductQuery())
            ->where('is_hot', 1)
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn($product) => $this->formatProduct($product))
            ->values()
            ->toArray();
    }

    private function getNewProducts(int $limit): array
    {
        return (clone $this->baseProductQuery())
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn($product) => $this->formatProduct($product))
            ->values()
            ->toArray();
    }

    private function getSaleProducts(int $limit): array
    {
        return (clone $this->baseProductQuery())
            ->whereNotNull('sale_price')
            ->whereColumn('sale_price', '<', 'price')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn($product) => $this->formatProduct($product))
            ->values()
            ->toArray();
    }

    private function getFeaturedFarms(int $limit): array
    {
        return Farm::query()
            ->select('farms.*')
            ->where('farms.status', 1)
            ->with([
                'seller:id,name',
            ])
            ->withCount([
                'products as products_count' => function ($query) {
                    $query->publiclyVisible();
                },
            ])

            // Tổng số lượng đã bán của farm
            ->selectSub(function ($query) {
                $query->from('order_items')
                    ->join('sub_orders', 'order_items.sub_order_id', '=', 'sub_orders.id')
                    ->whereColumn('sub_orders.farm_id', 'farms.id')
                    ->where('sub_orders.status', 3)
                    ->where('sub_orders.payment_status', 1)
                    ->whereNull('sub_orders.deleted_at')
                    ->selectRaw('COALESCE(SUM(order_items.quantity), 0)');
            }, 'sold_quantity')

            // Số đánh giá của farm
            ->selectSub(function ($query) {
                $query->from('reviews')
                    ->join('order_items', 'reviews.order_item_id', '=', 'order_items.id')
                    ->join('sub_orders', 'order_items.sub_order_id', '=', 'sub_orders.id')
                    ->whereColumn('sub_orders.farm_id', 'farms.id')
                    ->where('sub_orders.status', 3)
                    ->where('sub_orders.payment_status', 1)
                    ->where('reviews.status', 1)
                    ->whereNotNull('reviews.rating')
                    ->whereNull('reviews.deleted_at')
                    ->whereNull('sub_orders.deleted_at')
                    ->selectRaw('COUNT(reviews.id)');
            }, 'review_count')

            // Trung bình sao của farm
            ->selectSub(function ($query) {
                $query->from('reviews')
                    ->join('order_items', 'reviews.order_item_id', '=', 'order_items.id')
                    ->join('sub_orders', 'order_items.sub_order_id', '=', 'sub_orders.id')
                    ->whereColumn('sub_orders.farm_id', 'farms.id')
                    ->where('sub_orders.status', 3)
                    ->where('sub_orders.payment_status', 1)
                    ->where('reviews.status', 1)
                    ->whereNotNull('reviews.rating')
                    ->whereNull('reviews.deleted_at')
                    ->whereNull('sub_orders.deleted_at')
                    ->selectRaw('AVG(reviews.rating)');
            }, 'rating_avg')

            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn($farm) => $this->formatFarm($farm))
            ->values()
            ->toArray();
    }

    private function getStats(): array
    {
        $customerCount = Order::query()
            ->whereHas('subOrders', function ($q) {
                $q->where('status', 3)
                    ->where('payment_status', 1);
            })
            ->distinct('user_id')
            ->count('user_id');

        $reviewStats = Review::query()
            ->join('order_items', 'reviews.order_item_id', '=', 'order_items.id')
            ->join('sub_orders', 'order_items.sub_order_id', '=', 'sub_orders.id')
            ->where('reviews.status', 1)
            ->whereNotNull('reviews.rating')
            ->whereNull('reviews.deleted_at')
            ->where('sub_orders.status', 3)
            ->where('sub_orders.payment_status', 1)
            ->whereNull('sub_orders.deleted_at')
            ->selectRaw('COUNT(reviews.id) as total_reviews')
            ->selectRaw('SUM(CASE WHEN reviews.rating >= 4 THEN 1 ELSE 0 END) as satisfied_reviews')
            ->first();

        $totalReviews = (int) ($reviewStats->total_reviews ?? 0);
        $satisfiedReviews = (int) ($reviewStats->satisfied_reviews ?? 0);

        $satisfactionRate = $totalReviews > 0
            ? round(($satisfiedReviews / $totalReviews) * 100)
            : null;

        return [
            'farms_count' => Farm::where('status', 1)->count(),

            'products_count' => Product::query()
                ->publiclyVisible()
                ->count(),

            'categories_count' => Category::where('status', 1)->count(),

            // Số khách đã từng mua hàng thành công
            'customer_count' => $customerCount,

            // Tỷ lệ đánh giá hài lòng, rating >= 4
            'satisfaction_rate' => $satisfactionRate,
        ];
    }

    private function formatCategory(Category $category): array
    {
        return [
            'id' => $category->id,
            'parent_id' => $category->parent_id,

            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,

            'image' => $category->image,
            'image_url' => $category->image,

            'products_count' => (int) ($category->products_count ?? 0),

            'children' => $category->children
                ? $category->children->map(fn($child) => [
                    'id' => $child->id,
                    'parent_id' => $child->parent_id,
                    'name' => $child->name,
                    'slug' => $child->slug,
                    'description' => $child->description,
                    'image' => $child->image,
                    'image_url' => $child->image,
                ])->values()->toArray()
                : [],
        ];
    }

    private function formatProduct(Product $product): array
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

        $reviewCount = (int) ($product->review_count ?? 0);
        $commentCount = (int) ($product->comment_count ?? 0)
            + (int) ($product->reply_comment_count ?? 0);

        $rating = $reviewCount > 0 && $product->rating_avg !== null
            ? round((float) $product->rating_avg, 1)
            : null;


        $soldQuantity = (float) ($product->sold_quantity ?? 0);
        $soldQuantity30Days = (float) ($product->sold_quantity_30_days ?? 0);

        $isNew = $product->created_at !== null
            && $product->created_at->gte(
                now()->subDays(self::NEW_PRODUCT_DAYS)
            );

        $isBestSeller = $soldQuantity30Days
            >= self::BEST_SELLER_MIN_QUANTITY;

        return [
            'id' => $product->id,
            'farm_id' => $product->farm_id,
            'category_id' => $product->category_id,

            'name' => $product->name,
            'slug' => $product->slug,

            'thumbnail' => $product->thumbnail,
            'thumbnail_url' => $product->thumbnail,

            'price' => $price,
            'price_text' => $this->formatMoney($price),

            'sale_price' => $salePrice,
            'sale_price_text' => $salePrice !== null
                ? $this->formatMoney($salePrice)
                : null,

            'final_price' => $finalPrice,
            'final_price_text' => $this->formatMoney($finalPrice),

            'discount_percent' => $this->getDiscountPercent($price, $salePrice),

            'stock_quantity' => (float) $product->stock_quantity,
            'unit' => $product->unit,

            'is_hot' => (bool) $product->is_hot,
            'is_new' => $isNew,
            'is_best_seller' => $isBestSeller,
            'status' => (int) $product->status,
            'accepting_orders' => $orderAvailability['accepting_orders'],
            'order_unavailable_reason' => $orderAvailability['reason'],
            'required_policy_version' => $orderAvailability['policy_version'],

            'rating' => $rating,
            'rating_avg' => $rating,
            'review_count' => $reviewCount,
            'comment_count' => $commentCount,

            'order_count' => (int) ($product->order_count ?? 0),
            'sold_quantity' => $soldQuantity,
            'sold_quantity_30_days' => $soldQuantity30Days,

            // giữ alias để FE cũ không lỗi, nhưng không dùng để hiện review nữa
            'sold_count' => $soldQuantity,

            'created_at' => optional($product->created_at)->toISOString(),

            'farm' => $product->farm ? [
                'id' => $product->farm->id,
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
    }

    private function formatFarm(Farm $farm): array
    {
        $orderAvailability = $this->sellerPolicyAccessService
            ->availability($farm);
        $reviewCount = (int) ($farm->review_count ?? 0);

        $rating = $reviewCount > 0 && $farm->rating_avg !== null
            ? round((float) $farm->rating_avg, 1)
            : null;

        return [
            'id' => $farm->id,

            'name' => $farm->name,
            'slug' => $farm->slug,
            'description' => $farm->description,

            'logo' => $farm->logo,
            'logo_url' => $farm->logo,

            'cover_image' => $farm->cover_image,
            'cover_image_url' => $farm->cover_image,

            'phone' => $farm->phone,
            'address' => $farm->address,

            'status' => (int) $farm->status,

            'seller' => $farm->seller ? [
                'id' => $farm->seller->id,
                'name' => $farm->seller->name,
            ] : null,

            'products_count' => (int) ($farm->products_count ?? 0),

            'rating' => $rating,
            'rating_avg' => $rating,
            'review_count' => $reviewCount,

            'sold_quantity' => (float) ($farm->sold_quantity ?? 0),

            'certification_text' => 'Organic / VietGAP',
            'accepting_orders' => $orderAvailability['accepting_orders'],
            'order_unavailable_reason' => $orderAvailability['reason'],
        ];
    }

    private function getDiscountPercent(float $price, ?float $salePrice): ?int
    {
        if (!$salePrice || $salePrice >= $price || $price <= 0) {
            return null;
        }

        return (int) round((($price - $salePrice) / $price) * 100);
    }

    private function formatMoney(float $amount): string
    {
        return number_format($amount, 0, ',', '.') . 'đ';
    }

    private function getBestSellingProducts(int $limit): array
    {
        return (clone $this->baseProductQuery())
            ->orderByDesc('sold_quantity')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn($product) => $this->formatProduct($product))
            ->values()
            ->toArray();
    }
}
