<?php

namespace App\Services\Review;

use App\Models\OrderItem;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReviewService
{
    public function getMyReviews(User $user)
    {
        return Review::query()
            ->with([
                'orderItem.product.farm',
                'orderItem.product.category',
            ])
            ->whereHas('orderItem.subOrder.order', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->orderByDesc('id')
            ->get()
            ->map(fn ($review) => $this->formatReview($review))
            ->values();
    }

    public function getReviewableItems(User $user)
    {
        return OrderItem::query()
            ->with([
                'product.farm',
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
            ->whereDoesntHave('review')

            ->orderByDesc('id')
            ->get()
            ->map(fn ($item) => $this->formatReviewableItem($item))
            ->values();
    }

    public function create(User $user, array $data): array
    {
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
                'orderItem.product.category',
            ]);

            return $this->formatReview($review);
        });
    }

    public function update(User $user, Review $review, array $data): array
    {
        $this->ensureReviewOwner($user, $review);

        $review->update([
            'rating' => (int) $data['rating'],
            'comment' => $data['comment'] ?? null,
        ]);

        $review = $review->fresh([
            'orderItem.product.farm',
            'orderItem.product.category',
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

    private function ensureReviewOwner(User $user, Review $review): void
    {
        $review->loadMissing('orderItem.subOrder.order');

        $ownerId = $review->orderItem?->subOrder?->order?->user_id;

        if ((int) $ownerId !== (int) $user->id) {
            abort(403, 'Bạn không có quyền thao tác đánh giá này.');
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
                'farm' => $product->farm ? [
                    'id' => $product->farm->id,
                    'name' => $product->farm->name,
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
        $product = $item?->product;

        return [
            'id' => $review->id,
            'order_item_id' => $review->order_item_id,
            'rating' => (int) $review->rating,
            'comment' => $review->comment,
            'status' => (int) $review->status,
            'created_at' => optional($review->created_at)->format('d/m/Y H:i'),

            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug ?? null,
                'thumbnail' => $product->thumbnail ?? null,
                'thumbnail_url' => $product->thumbnail ?? null,
                'unit' => $product->unit ?? null,
                'farm' => $product->farm ? [
                    'id' => $product->farm->id,
                    'name' => $product->farm->name,
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
}
