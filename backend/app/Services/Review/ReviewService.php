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
        $purchasedItems = OrderItem::query()
            ->select(['id', 'product_id'])
            ->where('product_id', $productId)
            ->whereHas('subOrder.order', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->whereHas('subOrder', function ($query) {
                $query->where('status', 3)
                    ->whereIn('payment_status', [0, 1]);
            })
            ->latest('id')
            ->get();

        $reviewedOrderItemIds = Review::withTrashed()
            ->whereIn('order_item_id', $purchasedItems->pluck('id'))
            ->pluck('order_item_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $reviewableItem = $purchasedItems->first(
            fn (OrderItem $item) => !in_array((int) $item->id, $reviewedOrderItemIds, true)
        );

        return [
            'has_purchased' => $purchasedItems->isNotEmpty(),
            'can_comment' => $purchasedItems->isNotEmpty(),
            'can_rate' => $reviewableItem !== null,
            'order_item_id' => $reviewableItem?->id,
        ];
    }

    public function getReviewableItems(User $user)
    {
        return OrderItem::query()
            ->with([
                'product.farm',
                'product.approvedCertificate',
                'product.category',
                'review',
                'subOrder.order',
            ])
            ->whereHas('subOrder.order', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })

            // Đơn gian hàng đã hoàn thành
            ->whereHas('subOrder', function ($q) {
                $q->where('status', 3)
                    ->whereIn('payment_status', [0, 1]);
            })

            // Chưa đánh giá
            ->whereDoesntHave('review', function ($query) {
                $query->withTrashed();
            })

            ->orderByDesc('id')
            ->get()
            ->map(fn ($item) => $this->formatReviewableItem($item))
            ->values();
    }

    public function create(User $user, array $data): array
    {
        if (($data['entry_type'] ?? 'rating_review') === 'buyer_comment') {
            return $this->createBuyerComment($user, $data);
        }

        $orderItem = $this->findReviewableOrderItem(
            user: $user,
            orderItemId: (int) $data['order_item_id']
        );

        $hasReview = Review::withTrashed()
            ->where('order_item_id', $orderItem->id)
            ->exists();

        if ($hasReview) {
            throw ValidationException::withMessages([
                'order_item_id' => [
                    'Sản phẩm trong đơn hàng này đã được đánh giá.',
                ],
            ]);
        }

        return DB::transaction(function () use ($user, $data, $orderItem) {
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
        $orderItem = OrderItem::query()
            ->with([
                'product.farm',
                'product.approvedCertificate',
                'product.category',
                'subOrder.order',
            ])
            ->where('id', $orderItemId)
            ->whereHas('subOrder.order', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->whereHas('subOrder', function ($q) {
                $q->where('status', 3)
                    ->whereIn('payment_status', [0, 1]);
            })
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
        return OrderItem::query()
            ->where('product_id', $productId)
            ->whereHas('subOrder.order', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->whereHas('subOrder', function ($query) {
                $query->where('status', 3)
                    ->whereIn('payment_status', [0, 1]);
            })
            ->exists();
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
