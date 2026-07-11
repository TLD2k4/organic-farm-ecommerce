<?php

namespace App\Services\Review;

use Illuminate\Support\Facades\Schema;
use App\Models\Farm;
use App\Models\Review;
use App\Models\User;


class SellerReviewService
{
    public function getReviews(User $user, array $filters = []): array
    {
        $farm = $this->getSellerFarm($user);

        $page = max(1, (int) ($filters['page'] ?? 1));
        $limit = min(20, max(1, (int) ($filters['limit'] ?? 5)));

        $query = $this->baseSellerReviewQuery($farm->id)
            ->with([
                'user:id,name,email,avatar',
                'orderItem.product.farm',
                'orderItem.product.category',
                'orderItem.subOrder.order.user:id,name,email',
            ]);

        if (!empty($filters['rating'])) {
            $query->where('rating', (int) $filters['rating']);
        }

        if ($filters['status'] !== null && $filters['status'] !== '') {
            $query->where('status', (int) $filters['status']);
        }

        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where('comment', 'like', "%{$keyword}%")
                    ->orWhereHas('orderItem.product', function ($productQ) use ($keyword) {
                        $productQ->where('name', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('user', function ($userQ) use ($keyword) {
                        $userQ->where('name', 'like', "%{$keyword}%")
                            ->orWhere('email', 'like', "%{$keyword}%");
                    });
            });
        }

        $paginator = $query
            ->orderByDesc('id')
            ->paginate($limit, ['*'], 'page', $page);

        return [
            'reviews' => $paginator->getCollection()
                ->map(fn ($review) => $this->formatReview($review))
                ->values(),

            'stats' => $this->getStats($farm->id),

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

    public function updateStatus(User $user, Review $review, int $status): array
    {
        $farm = $this->getSellerFarm($user);

        $this->ensureReviewBelongsToFarm($review, $farm->id);

        $review->update([
            'status' => $status,
        ]);

        $review = $review->fresh([
            'user:id,name,email,avatar',
            'orderItem.product.farm',
            'orderItem.product.category',
            'orderItem.subOrder.order.user:id,name,email',
        ]);

        return $this->formatReview($review);
    }

    private function getSellerFarm(User $user): Farm
    {
        $query = Farm::query();

        if (Schema::hasColumn('farms', 'user_id')) {
            $query->where('user_id', $user->id);
        } elseif (Schema::hasColumn('farms', 'owner_id')) {
            $query->where('owner_id', $user->id);
        } elseif (Schema::hasColumn('farms', 'seller_id')) {
            $query->where('seller_id', $user->id);
        } else {
            abort(500, 'Bảng farms chưa có cột liên kết với user.');
        }

        $farm = $query->first();

        if (!$farm) {
            abort(403, 'Bạn chưa có nông trại hoặc không có quyền seller.');
        }

        return $farm;
    }

    private function baseSellerReviewQuery(int $farmId)
    {
        return Review::query()
            ->whereHas('orderItem.product', function ($q) use ($farmId) {
                $q->where('farm_id', $farmId);
            });
    }

    private function ensureReviewBelongsToFarm(Review $review, int $farmId): void
    {
        $review->loadMissing('orderItem.product');

        if ((int) $review->orderItem?->product?->farm_id !== (int) $farmId) {
            abort(403, 'Bạn không có quyền thao tác đánh giá này.');
        }
    }

    private function getStats(int $farmId): array
    {
        $baseQuery = $this->baseSellerReviewQuery($farmId);

        $ratingCounts = (clone $baseQuery)
            ->selectRaw('rating, COUNT(*) as total')
            ->groupBy('rating')
            ->pluck('total', 'rating');

        return [
            'total_reviews' => (clone $baseQuery)->count(),
            'visible_reviews' => (clone $baseQuery)->where('status', 1)->count(),
            'hidden_reviews' => (clone $baseQuery)->where('status', 0)->count(),
            'avg_rating' => round((float) (clone $baseQuery)->avg('rating'), 1),

            'rating_counts' => [
                5 => (int) ($ratingCounts[5] ?? 0),
                4 => (int) ($ratingCounts[4] ?? 0),
                3 => (int) ($ratingCounts[3] ?? 0),
                2 => (int) ($ratingCounts[2] ?? 0),
                1 => (int) ($ratingCounts[1] ?? 0),
            ],
        ];
    }

    private function formatReview(Review $review): array
    {
        $product = $review->orderItem?->product;
        $buyer = $review->user ?: $review->orderItem?->subOrder?->order?->user;

        return [
            'id' => $review->id,
            'rating' => (int) $review->rating,
            'comment' => $review->comment,
            'status' => (int) $review->status,
            'status_label' => (int) $review->status === 1 ? 'Hiển thị' : 'Đã ẩn',
            'created_at' => optional($review->created_at)->format('d/m/Y H:i'),

            'buyer' => $buyer ? [
                'id' => $buyer->id,
                'name' => $buyer->name,
                'email' => $buyer->email,
                'avatar' => $buyer->avatar ?? null,
            ] : null,

            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug ?? null,
                'thumbnail' => $product->thumbnail ?? null,
                'thumbnail_url' => $product->thumbnail ?? null,
                'unit' => $product->unit ?? null,
            ] : null,
        ];
    }
}