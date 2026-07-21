<?php

namespace App\Services\Review;

use App\Models\Review;
use App\Models\ReviewReply;
use App\Models\Product;
use App\Models\Farm;
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

        if (($filters['type'] ?? '') === 'rating_review') {
            $query->whereNotNull('rating');
        } elseif (($filters['type'] ?? '') === 'comment') {
            $query->where(function (Builder $contentQuery) {
                $contentQuery
                    ->where(function (Builder $commentQuery) {
                        $commentQuery->whereNotNull('comment')
                            ->whereRaw("TRIM(comment) <> ''");
                    })
                    ->orWhereHas('replies', function (Builder $replyQuery) {
                        $replyQuery->whereNotNull('comment')
                            ->whereRaw("TRIM(comment) <> ''");
                    });
            });
        }

        if (($filters['deleted'] ?? '') === 'only') {
            $query->onlyTrashed();
        } elseif (($filters['deleted'] ?? '') === 'with') {
            $query->withTrashed();
        }

        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);
            $productId = $this->extractProductId($keyword);

            $query->where(function (Builder $builder) use ($keyword, $productId) {
                $builder->where('comment', 'like', "%{$keyword}%")
                    ->orWhereHas('replies', function (Builder $replyQuery) use ($keyword) {
                        $replyQuery->where('comment', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('user', function (Builder $userQuery) use ($keyword) {
                        $userQuery->where('name', 'like', "%{$keyword}%")
                            ->orWhere('email', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('orderItem.product', function (Builder $productQuery) use ($keyword, $productId) {
                        $productQuery->where(function (Builder $nested) use ($keyword, $productId) {
                            $nested->where('products.name', 'like', "%{$keyword}%")
                                ->orWhere('products.slug', 'like', "%{$keyword}%")
                                ->when($productId !== null, fn (Builder $idQuery) => $idQuery->orWhere('products.id', $productId));
                        });
                    })
                    ->orWhereHas('product', function (Builder $productQuery) use ($keyword, $productId) {
                        $productQuery->where(function (Builder $nested) use ($keyword, $productId) {
                            $nested->where('products.name', 'like', "%{$keyword}%")
                                ->orWhere('products.slug', 'like', "%{$keyword}%")
                                ->when($productId !== null, fn (Builder $idQuery) => $idQuery->orWhere('products.id', $productId));
                        });
                    });
            });
        }

        $perPage = max(5, min((int) ($filters['per_page'] ?? 10), 50));
        $paginator = $query->latest('id')->paginate($perPage);
        $reviews = $paginator->getCollection();
        $publicProductIds = $this->getPublicProductIdLookup($reviews);

        return [
            'reviews' => $reviews
                ->map(function (Review $review) use ($publicProductIds) {
                    $product = $review->product ?: $review->orderItem?->product;

                    return $this->formatReview(
                        $review,
                        $product && isset($publicProductIds[$product->id])
                    );
                })
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
            'user.roles',
            'moderator:id,name,email',
            'orderItem.product.farm:id,name,slug,status,deleted_at',
            'product.farm:id,name,slug,status,deleted_at',
            'replies.user.roles',
        ]);
    }

    private function getPublicProductIdLookup($reviews): array
    {
        $productIds = $reviews
            ->map(function (Review $review) {
                return $review->product?->id
                    ?: $review->orderItem?->product?->id;
            })
            ->filter()
            ->unique()
            ->values();

        if ($productIds->isEmpty()) {
            return [];
        }

        return Product::query()
            ->whereKey($productIds)
            ->publiclyVisible()
            ->pluck('id')
            ->mapWithKeys(fn ($id) => [(int) $id => true])
            ->all();
    }

    private function reviewRelations(): array
    {
        return [
            'user:id,name,email,avatar',
            'user.roles',
            'moderator:id,name,email',
            'orderItem.product.farm:id,name,slug,status,deleted_at',
            'product.farm:id,name,slug,status,deleted_at',
            'replies.user.roles',
        ];
    }

    private function extractProductId(string $keyword): ?int
    {
        $normalized = strtoupper(preg_replace('/\s+/', '', $keyword));

        if (preg_match('/^SP0*(\d+)$/', $normalized, $matches)) {
            return (int) $matches[1];
        }

        if (preg_match('/^#?(\d+)$/', $normalized, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }

    private function loadRelations(Review $review): Review
    {
        return $review->load($this->reviewRelations());
    }

    private function getStats(): array
    {
        // Đánh giá chỉ phụ thuộc vào việc có chấm sao.
        $ratingReviews = Review::query()
            ->whereNotNull('rating');

        // Bình luận gốc: mọi reviews.comment có nội dung, kể cả đánh giá có sao.
        $directComments = Review::query()
            ->whereNotNull('comment')
            ->whereRaw("TRIM(comment) <> ''");

        // Phản hồi review_replies cũng là bình luận.
        // Chỉ tính reply có parent review chưa bị xóa mềm.
        $replyComments = ReviewReply::query()
            ->whereHas('review')
            ->whereNotNull('comment')
            ->whereRaw("TRIM(comment) <> ''");

        $totalComments = (clone $directComments)->count()
            + (clone $replyComments)->count();

        $visibleComments = (clone $directComments)
            ->where('status', 1)
            ->count()
            + (clone $replyComments)
                ->where('status', 1)
                ->whereHas('review', function (Builder $reviewQuery) {
                    $reviewQuery->where('status', 1);
                })
                ->count();

        $deletedComments = Review::onlyTrashed()
            ->whereNotNull('comment')
            ->whereRaw("TRIM(comment) <> ''")
            ->count()
            + ReviewReply::onlyTrashed()
                ->whereNotNull('comment')
                ->whereRaw("TRIM(comment) <> ''")
                ->count()
            + ReviewReply::query()
                ->whereNotNull('comment')
                ->whereRaw("TRIM(comment) <> ''")
                ->whereHas('review', function (Builder $reviewQuery) {
                    $reviewQuery->onlyTrashed();
                })
                ->count();

        return [
            'total' => (clone $ratingReviews)->count(),
            'visible' => (clone $ratingReviews)->where('status', 1)->count(),
            'hidden' => (clone $ratingReviews)->where('status', 0)->count(),
            'deleted' => Review::onlyTrashed()->count(),
            'deleted_reviews' => Review::onlyTrashed()
                ->whereNotNull('rating')
                ->count(),
            'average_rating' => round((float) (clone $ratingReviews)->avg('rating'), 1),
            'total_comments' => $totalComments,
            'visible_comments' => $visibleComments,
            'hidden_comments' => max(0, $totalComments - $visibleComments),
            'deleted_comments' => $deletedComments,
        ];
    }

    private function formatReview(
        Review $review,
        ?bool $publiclyVisible = null
    ): array
    {
        $product = $review->product ?: $review->orderItem?->product;
        $author = $review->user;
        $isRatingReview = $review->rating !== null;
        $hasComment = trim((string) $review->comment) !== '';
        $isAdminComment = !$isRatingReview && $author?->hasRole('admin');
        $isSellerComment = !$isRatingReview && !$isAdminComment && $author?->hasRole('seller');
        $isBuyerComment = !$isRatingReview && !$isAdminComment && !$isSellerComment;
        $entryType = match (true) {
            $isRatingReview => 'rating_review',
            $isAdminComment => 'admin_comment',
            $isSellerComment => 'seller_comment',
            default => 'buyer_comment',
        };
        $entryTypeLabel = match ($entryType) {
            'rating_review' => $hasComment
                ? 'Đánh giá kèm bình luận'
                : 'Đánh giá người mua',
            'admin_comment' => 'Bình luận quản trị',
            'seller_comment' => 'Bình luận người bán',
            default => 'Bình luận người mua',
        };
        $isPubliclyVisible = $publiclyVisible
            ?? $this->isProductPubliclyVisible($product);

        return [
            'id' => $review->id,
            'rating' => $review->rating !== null ? (int) $review->rating : null,
            'entry_type' => $entryType,
            'entry_type_label' => $entryTypeLabel,
            'is_rating_review' => $isRatingReview,
            'is_admin_comment' => (bool) $isAdminComment,
            'is_seller_comment' => (bool) $isSellerComment,
            'is_buyer_comment' => (bool) $isBuyerComment,
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
            'author' => $author ? [
                'id' => $author->id,
                'name' => $author->name,
                'email' => $author->email,
                'avatar' => $author->avatar,
            ] : null,
            'buyer' => $author ? [
                'id' => $author->id,
                'name' => $author->name,
                'email' => $author->email,
                'avatar' => $author->avatar,
            ] : null,
            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'thumbnail' => $product->thumbnail,
                'status' => (int) $product->status,
                'deleted_at' => $product->deleted_at,
                'is_publicly_visible' => (bool) $isPubliclyVisible,
                'farm_name' => $product->farm?->name,
                'farm' => $product->farm ? [
                    'id' => $product->farm->id,
                    'name' => $product->farm->name,
                    'slug' => $product->farm->slug,
                    'status' => (int) $product->farm->status,
                    'deleted_at' => $product->farm->deleted_at,
                ] : null,
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

    private function isProductPubliclyVisible(?Product $product): bool
    {
        if (!$product) {
            return false;
        }

        return Product::query()
            ->whereKey($product->id)
            ->publiclyVisible()
            ->exists();
    }
}
