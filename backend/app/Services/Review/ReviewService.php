<?php

namespace App\Services\Review;

use App\Models\Farm;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReviewService
{
    public function getMyReviews(User $user)
    {
        return Review::withTrashed()
            ->with([
                'orderItem.product.farm',
                'orderItem.product.approvedCertificate',
                'orderItem.product.category',
                'product.farm',
                'product.approvedCertificate',
                'product.category',
                'moderator:id,name,email',
                'replies' => function ($query) {
                    $query->where('status', 1)
                        ->with('user.roles');
                },
            ])
            ->where('user_id', $user->id)
            ->orderByDesc('id')
            ->get()
            ->map(fn ($review) => $this->formatReview($review))
            ->values();
    }

    public function getProductEligibility(User $user, int $productId): array
    {
        $purchasedItems = $this->completedPurchaseItemsQuery($user, $productId)
            ->select(['id', 'sub_order_id', 'product_id'])
            ->with('subOrder:id,order_id')
            ->latest('id')
            ->get()
            ->unique(fn (OrderItem $item) => (int) $item->subOrder?->order_id)
            ->values();

        $reviewedKeys = $this->getReviewedOrderProductKeys($user);

        $reviewableItem = $purchasedItems->first(
            fn (OrderItem $item) => !isset($reviewedKeys[
                $this->ratingKey(
                    (int) $item->subOrder?->order_id,
                    (int) $item->product_id
                )
            ])
        );

        return [
            'has_purchased' => $purchasedItems->isNotEmpty(),
            'can_comment' => $purchasedItems->isNotEmpty(),
            'can_rate' => $reviewableItem !== null,
            'order_item_id' => $reviewableItem?->id,
            'order_id' => $reviewableItem?->subOrder?->order_id,
        ];
    }

    public function getReviewableItems(User $user)
    {
        $items = $this->completedPurchaseItemsQuery($user)
            ->with([
                'product.farm',
                'product.approvedCertificate',
                'product.category',
                'subOrder.order',
            ])
            ->orderByDesc('id')
            ->get();

        $reviewedKeys = $this->getReviewedOrderProductKeys($user);

        return $items
            // Một sản phẩm chỉ xuất hiện một lần trong mỗi đơn, dù số lượng
            // mua hoặc số dòng order_items của sản phẩm đó là bao nhiêu.
            ->unique(fn (OrderItem $item) => $this->ratingKey(
                (int) $item->subOrder?->order_id,
                (int) $item->product_id
            ))
            ->reject(fn (OrderItem $item) => isset($reviewedKeys[
                $this->ratingKey(
                    (int) $item->subOrder?->order_id,
                    (int) $item->product_id
                )
            ]))
            ->map(fn ($item) => $this->formatReviewableItem($item))
            ->values();
    }

    public function create(User $user, array $data): array
    {
        if (($data['entry_type'] ?? 'rating_review') === 'buyer_comment') {
            return $this->createBuyerComment($user, $data);
        }

        return DB::transaction(function () use ($user, $data) {
            $orderItem = $this->findReviewableOrderItem(
                user: $user,
                orderItemId: (int) $data['order_item_id']
            );

            // Khóa đơn gian hàng để hai request đồng thời không thể tạo hai
            // đánh giá cho cùng một sản phẩm trong cùng một đơn.
            $subOrder = $orderItem->subOrder()
                ->lockForUpdate()
                ->firstOrFail();
            $orderId = (int) $subOrder->order_id;

            if ($this->hasRatingForOrderProduct(
                $user,
                $orderId,
                (int) $orderItem->product_id
            )) {
                throw ValidationException::withMessages([
                    'order_item_id' => [
                        'Sản phẩm này đã được đánh giá trong đơn hàng đã chọn.',
                    ],
                ]);
            }

            $review = Review::create([
                'user_id' => $user->id,
                'order_item_id' => $orderItem->id,
                'product_id' => $orderItem->product_id,
                'rating' => (int) $data['rating'],
                'comment' => $data['comment'] ?? null,
                'status' => 1,
            ])->load([
                'orderItem.product.farm',
                'orderItem.product.approvedCertificate',
                'orderItem.product.category',
                'moderator:id,name,email',
                'replies.user.roles',
            ]);

            return $this->formatReview($review);
        });
    }

    public function update(User $user, Review $review, array $data): array
    {
        $this->ensureReviewOwner($user, $review);

        $isRatingReview = $review->order_item_id !== null
            && $review->rating !== null;

        if ($isRatingReview) {
            $review->update([
                'rating' => (int) $data['rating'],
                'comment' => $data['comment'] ?? null,
            ]);
        } else {
            $comment = trim((string) ($data['comment'] ?? ''));

            if ($comment === '') {
                throw ValidationException::withMessages([
                    'comment' => ['Vui lòng nhập nội dung bình luận.'],
                ]);
            }

            $review->update([
                'rating' => null,
                'comment' => $comment,
            ]);
        }

        $review = $review->fresh([
            'orderItem.product.farm',
            'orderItem.product.approvedCertificate',
            'orderItem.product.category',
            'product.farm',
            'product.approvedCertificate',
            'product.category',
            'moderator:id,name,email',
            'replies.user.roles',
        ]);

        return $this->formatReview($review);
    }

    public function delete(User $user, Review $review): void
    {
        $this->ensureReviewOwner($user, $review);

        $review->delete();
    }

    private function findReviewableOrderItem(User $user, int $orderItemId): OrderItem
    {
        $orderItem = $this->completedPurchaseItemsQuery($user)
            ->with([
                'product.farm',
                'product.approvedCertificate',
                'product.category',
                'subOrder.order',
            ])
            ->where('id', $orderItemId)
            ->first();

        if (!$orderItem) {
            throw ValidationException::withMessages([
                'order_item_id' => [
                    'Bạn chỉ có thể đánh giá sản phẩm đã mua và đơn hàng đã hoàn tất.',
                ],
            ]);
        }

        return $orderItem;
    }

    private function createBuyerComment(User $user, array $data): array
    {
        $productId = (int) $data['product_id'];
        $comment = trim((string) ($data['comment'] ?? ''));

        if (!$this->hasCompletedPurchase($user, $productId)) {
            throw ValidationException::withMessages([
                'product_id' => [
                    'Bạn chỉ có thể bình luận sản phẩm đã mua và có đơn hàng hoàn tất.',
                ],
            ]);
        }

        if ($comment === '') {
            throw ValidationException::withMessages([
                'comment' => ['Vui lòng nhập nội dung bình luận.'],
            ]);
        }

        return DB::transaction(function () use ($user, $productId, $comment) {
            $review = Review::create([
                'user_id' => $user->id,
                'order_item_id' => null,
                'product_id' => $productId,
                'rating' => null,
                'comment' => $comment,
                'status' => 1,
            ])->load([
                'product.farm',
                'product.approvedCertificate',
                'product.category',
                'moderator:id,name,email',
                'replies.user.roles',
            ]);

            return $this->formatReview($review);
        });
    }

    private function hasCompletedPurchase(User $user, int $productId): bool
    {
        return $this->completedPurchaseItemsQuery($user, $productId)
            ->exists();
    }

    private function completedPurchaseItemsQuery(User $user, ?int $productId = null)
    {
        return OrderItem::query()
            ->when($productId !== null, fn ($query) => $query->where('product_id', $productId))
            ->whereHas('subOrder.order', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->where('status', 3);
            })
            ->whereHas('subOrder', function ($query) {
                $query->where('status', 3)
                    ->where('payment_status', 1)
                    ->whereNotNull('completed_at');
            });
    }

    private function getReviewedOrderProductKeys(User $user): array
    {
        return Review::withTrashed()
            ->join('order_items', 'reviews.order_item_id', '=', 'order_items.id')
            ->join('sub_orders', 'order_items.sub_order_id', '=', 'sub_orders.id')
            ->where('reviews.user_id', $user->id)
            ->whereNotNull('reviews.order_item_id')
            ->whereNotNull('reviews.rating')
            ->get([
                'sub_orders.order_id as reviewed_order_id',
                'order_items.product_id as reviewed_product_id',
            ])
            ->mapWithKeys(fn ($review) => [
                $this->ratingKey(
                    (int) $review->reviewed_order_id,
                    (int) $review->reviewed_product_id
                ) => true,
            ])
            ->all();
    }

    private function hasRatingForOrderProduct(
        User $user,
        int $orderId,
        int $productId
    ): bool {
        return Review::withTrashed()
            ->where('user_id', $user->id)
            ->whereNotNull('order_item_id')
            ->whereNotNull('rating')
            ->whereHas('orderItem', function ($query) use ($orderId, $productId) {
                $query->where('product_id', $productId)
                    ->whereHas('subOrder', function ($subOrderQuery) use ($orderId) {
                        $subOrderQuery->where('order_id', $orderId);
                    });
            })
            ->exists();
    }

    private function ratingKey(int $orderId, int $productId): string
    {
        return $orderId . ':' . $productId;
    }

    private function ensureReviewOwner(User $user, Review $review): void
    {
        if ((int) $review->user_id !== (int) $user->id) {
            abort(403, 'Bạn không có quyền thao tác đánh giá này.');
        }

        $isRatingReview = $review->order_item_id !== null
            && $review->rating !== null;

        if (!$isRatingReview && !$this->hasCompletedPurchase($user, (int) $review->product_id)) {
            abort(403, 'Bạn không có quyền thao tác bình luận này.');
        }
    }

    private function formatReviewableItem(OrderItem $item): array
    {
        $product = $item->product;

        return [
            'id' => $item->id,
            'order_item_id' => $item->id,
            'order_id' => $item->subOrder?->order?->id,
            'order_code' => $item->subOrder?->order?->order_code,
            'quantity' => (float) $item->quantity,
            'price' => (float) $item->price,

            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug ?? null,
                'thumbnail' => $product->thumbnail ?? null,
                'thumbnail_url' => $product->thumbnail ?? null,
                'unit' => $product->unit ?? null,
                'is_publicly_visible' => $this->isProductPubliclyVisible($product),
                'farm' => $product->farm ? [
                    'id' => $product->farm->id,
                    'name' => $product->farm->name,
                    'slug' => $product->farm->slug,
                    'status' => (int) $product->farm->status,
                ] : null,
            ] : [
                'id' => $item->product_id,
                'name' => $item->product_name ?? 'Sản phẩm',
                'slug' => null,
                'thumbnail' => null,
                'thumbnail_url' => null,
                'unit' => null,
                'farm' => null,
            ],
        ];
    }

    private function formatReview(Review $review): array
    {
        $item = $review->orderItem;
        $product = $review->product ?: $item?->product;
        $isRatingReview = $review->order_item_id !== null
            && $review->rating !== null;

        return [
            'id' => $review->id,
            'order_item_id' => $review->order_item_id,
            'rating' => $review->rating !== null ? (int) $review->rating : null,
            'entry_type' => $isRatingReview ? 'rating_review' : 'buyer_comment',
            'entry_type_label' => $isRatingReview ? 'Đánh giá người mua' : 'Bình luận người mua',
            'is_rating_review' => $isRatingReview,
            'is_buyer_comment' => !$isRatingReview,
            'comment' => $review->comment,
            'status' => (int) $review->status,
            'status_label' => $review->trashed()
                ? 'Đã bị xóa'
                : ((int) $review->status === 1 ? 'Đang hiển thị' : 'Đã bị ẩn'),
            'created_at' => optional($review->created_at)->format('d/m/Y H:i'),
            'deleted_at' => optional($review->deleted_at)->format('d/m/Y H:i'),
            'deleted_by_owner' => $review->trashed() && $review->moderated_by === null,
            'moderation_reason' => $review->moderation_reason,
            'moderated_at' => optional($review->moderated_at)->format('d/m/Y H:i'),
            'moderated_by' => $review->moderator ? [
                'id' => $review->moderator->id,
                'name' => $review->moderator->name,
                'email' => $review->moderator->email,
            ] : null,

            'replies' => $review->replies
                ->where('status', 1)
                ->map(fn ($reply) => [
                    'id' => $reply->id,
                    'comment' => $reply->comment,
                    'created_at' => optional($reply->created_at)->format('d/m/Y H:i'),
                    'user' => $reply->user ? [
                        'id' => $reply->user->id,
                        'name' => $reply->user->name,
                        'roles' => $reply->user->getRoleNames()->values(),
                    ] : null,
                ])
                ->values(),

            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug ?? null,
                'thumbnail' => $product->thumbnail ?? null,
                'thumbnail_url' => $product->thumbnail ?? null,
                'unit' => $product->unit ?? null,
                'is_publicly_visible' => $this->isProductPubliclyVisible($product),
                'farm' => $product->farm ? [
                    'id' => $product->farm->id,
                    'name' => $product->farm->name,
                    'slug' => $product->farm->slug,
                    'status' => (int) $product->farm->status,
                ] : null,
            ] : [
                'id' => $item?->product_id,
                'name' => $item?->product_name ?? 'Sản phẩm',
                'slug' => null,
                'thumbnail' => null,
                'thumbnail_url' => null,
                'unit' => null,
                'farm' => null,
            ],
        ];
    }

    private function isProductPubliclyVisible(Product $product): bool
    {
        return (int) $product->status === 1
            && $product->farm
            && (int) $product->farm->status === Farm::STATUS_ACTIVE
            && $product->approvedCertificate !== null;
    }
}
