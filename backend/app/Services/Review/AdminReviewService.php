<?php

namespace App\Services\Review;

use App\Models\Review;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class AdminReviewService
{
    public function getReviews(array $filters = []): array
    {
        $query = $this->baseQuery();

        if (($filters['status'] ?? '') !== '') {
            $query->where('status', (int) $filters['status']);
        }

        if (!empty($filters['rating'])) {
            $query->where('rating', (int) $filters['rating']);
        }

        if (($filters['deleted'] ?? '') === 'only') {
            $query->onlyTrashed();
        } elseif (($filters['deleted'] ?? '') === 'with') {
            $query->withTrashed();
        }

        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);

            $query->where(function (Builder $builder) use ($keyword) {
                $builder->where('comment', 'like', "%{$keyword}%")
                    ->orWhereHas('user', function (Builder $userQuery) use ($keyword) {
                        $userQuery->where('name', 'like', "%{$keyword}%")
                            ->orWhere('email', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('orderItem.product', function (Builder $productQuery) use ($keyword) {
                        $productQuery->where('name', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('product', function (Builder $productQuery) use ($keyword) {
                        $productQuery->where('name', 'like', "%{$keyword}%")
                            ->orWhere('code', 'like', "%{$keyword}%");
                    });
            });
        }

        $perPage = max(5, min((int) ($filters['per_page'] ?? 10), 50));
        $paginator = $query->latest('id')->paginate($perPage);

        return [
            'reviews' => $paginator->getCollection()
                ->map(fn (Review $review) => $this->formatReview($review))
                ->values(),
            'stats' => $this->getStats(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }

    public function updateStatus(
        User $admin,
        Review $review,
        int $status,
        ?string $reason = null
    ): array {
        if ($review->trashed()) {
            throw ValidationException::withMessages([
                'review' => ['Đánh giá đã bị xóa. Vui lòng khôi phục trước.'],
            ]);
        }

        $review->update([
            'status' => $status,
            'moderated_by' => $admin->id,
            'moderated_at' => now(),
            'moderation_reason' => $status === 0 ? trim((string) $reason) : null,
        ]);

        return $this->formatReview($this->loadRelations($review->fresh()));
    }

    public function destroy(User $admin, int $reviewId, string $reason): void
    {
        $review = Review::query()->findOrFail($reviewId);

        $review->update([
            'moderated_by' => $admin->id,
            'moderated_at' => now(),
            'moderation_reason' => trim($reason),
        ]);

        $review->delete();
    }

    public function restore(User $admin, int $reviewId): array
    {
        $review = Review::withTrashed()->findOrFail($reviewId);

        if (!$review->trashed()) {
            throw ValidationException::withMessages([
                'review' => ['Đánh giá chưa bị xóa.'],
            ]);
        }

        $review->restore();
        $review->update([
            'moderated_by' => $admin->id,
            'moderated_at' => now(),
            'moderation_reason' => null,
        ]);

        return $this->formatReview($this->loadRelations($review->fresh()));
    }

    public function reply(User $admin, Review $review, string $comment): array
    {
        if ($review->trashed()) {
            throw ValidationException::withMessages([
                'review' => ['Không thể trả lời đánh giá đã bị xóa.'],
            ]);
        }

        $review->replies()->create([
            'user_id' => $admin->id,
            'comment' => trim($comment),
            'status' => 1,
        ]);

        return $this->formatReview($this->loadRelations($review->fresh()));
    }

    public function createProductComment(
        User $admin,
        int $productId,
        string $comment
    ): array {
        $product = Product::withoutGlobalScope('farm_not_deleted')
            ->findOrFail($productId);

        $review = Review::create([
            'user_id' => $admin->id,
            'order_item_id' => null,
            'product_id' => $product->id,
            'rating' => null,
            'comment' => trim($comment),
            'status' => 1,
        ]);

        return $this->formatReview($this->loadRelations($review));
    }

    private function baseQuery(): Builder
    {
        return Review::query()->with([
            'user:id,name,email,avatar',
            'moderator:id,name,email',
            'orderItem.product.farm:id,name,slug',
            'product.farm:id,name,slug',
            'replies.user:id,name,email',
        ]);
    }

    private function loadRelations(Review $review): Review
    {
        return $review->load([
            'user:id,name,email,avatar',
            'moderator:id,name,email',
            'orderItem.product.farm:id,name,slug',
            'product.farm:id,name,slug',
            'replies.user:id,name,email',
        ]);
    }

    private function getStats(): array
    {
        $base = Review::query()
            ->whereNotNull('order_item_id')
            ->whereNotNull('rating');

        return [
            'total' => (clone $base)->count(),
            'visible' => (clone $base)->where('status', 1)->count(),
            'hidden' => (clone $base)->where('status', 0)->count(),
            'deleted' => Review::onlyTrashed()->count(),
            'average_rating' => round((float) (clone $base)->avg('rating'), 1),
        ];
    }

    private function formatReview(Review $review): array
    {
        $product = $review->product ?: $review->orderItem?->product;

        return [
            'id' => $review->id,
            'rating' => $review->rating !== null ? (int) $review->rating : null,
            'comment' => $review->comment,
            'status' => (int) $review->status,
            'status_text' => (int) $review->status === 1 ? 'Hiển thị' : 'Đã ẩn',
            'created_at' => optional($review->created_at)->format('d/m/Y H:i'),
            'deleted_at' => optional($review->deleted_at)->format('d/m/Y H:i'),
            'moderation_reason' => $review->moderation_reason,
            'moderated_at' => optional($review->moderated_at)->format('d/m/Y H:i'),
            'moderated_by' => $review->moderator ? [
                'id' => $review->moderator->id,
                'name' => $review->moderator->name,
                'email' => $review->moderator->email,
            ] : null,
            'buyer' => $review->user ? [
                'id' => $review->user->id,
                'name' => $review->user->name,
                'email' => $review->user->email,
                'avatar' => $review->user->avatar,
            ] : null,
            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'thumbnail' => $product->thumbnail,
                'farm_name' => $product->farm?->name,
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
        ];
    }
}
