<?php

namespace App\Services\Review;

use Illuminate\Support\Facades\Schema;
use App\Models\Farm;
use App\Models\Review;
use App\Models\ReviewReply;
use App\Models\User;
use App\Models\Product;


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
                'user.roles',
                'orderItem.product.farm',
                'orderItem.product.category',
                'orderItem.product.approvedCertificate',
                'product.farm',
                'product.category',
                'product.approvedCertificate',
                'orderItem.subOrder.order.user:id,name,email',
                'moderator:id,name,email',
                'replies.user.roles',
            ]);

        if (!empty($filters['rating'])) {
            $query->where('rating', (int) $filters['rating']);
        }

        if (($filters['type'] ?? '') === 'rating_review') {
            $query->whereNotNull('rating');
        } elseif (($filters['type'] ?? '') === 'comment') {
            $query->where(function ($contentQuery) {
                $contentQuery
                    ->where(function ($commentQuery) {
                        $commentQuery->whereNotNull('comment')
                            ->whereRaw("TRIM(comment) <> ''");
                    })
                    ->orWhereHas('replies', function ($replyQuery) {
                        $replyQuery->whereNotNull('comment')
                            ->whereRaw("TRIM(comment) <> ''");
                    });
            });
        }

        if (($filters['status'] ?? '') !== null && ($filters['status'] ?? '') !== '') {
            $query->where('status', (int) $filters['status']);
        }

        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);
            $productId = $this->extractProductId($keyword);

            $query->where(function ($q) use ($keyword, $productId) {
                $q->where('comment', 'like', "%{$keyword}%")
                    ->orWhereHas('replies', function ($replyQuery) use ($keyword) {
                        $replyQuery->where('comment', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('orderItem.product', function ($productQ) use ($keyword, $productId) {
                        $productQ->where(function ($nested) use ($keyword, $productId) {
                            $nested->where('products.name', 'like', "%{$keyword}%")
                                ->orWhere('products.slug', 'like', "%{$keyword}%")
                                ->when($productId !== null, fn ($idQuery) => $idQuery->orWhere('products.id', $productId));
                        });
                    })
                    ->orWhereHas('product', function ($productQ) use ($keyword, $productId) {
                        $productQ->where(function ($nested) use ($keyword, $productId) {
                            $nested->where('products.name', 'like', "%{$keyword}%")
                                ->orWhere('products.slug', 'like', "%{$keyword}%")
                                ->when($productId !== null, fn ($idQuery) => $idQuery->orWhere('products.id', $productId));
                        });
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

    public function updateStatus(
        User $user,
        Review $review,
        int $status,
        ?string $reason = null
    ): array
    {
        $farm = $this->getSellerFarm($user);

        $this->ensureReviewBelongsToFarm($review, $farm->id);

        $review->update([
            'status' => $status,
            'moderated_by' => $user->id,
            'moderated_at' => now(),
            'moderation_reason' => $status === 0 ? trim((string) $reason) : null,
        ]);

        $review = $review->fresh([
            'user:id,name,email,avatar',
            'user.roles',
            'orderItem.product.farm',
            'orderItem.product.category',
            'product.farm',
            'product.category',
            'orderItem.subOrder.order.user:id,name,email',
            'moderator:id,name,email',
            'replies.user.roles',
        ]);

        return $this->formatReview($review);
    }

    public function reply(User $user, Review $review, string $comment): array
    {
        $farm = $this->getSellerFarm($user);
        $this->ensureReviewBelongsToFarm($review, $farm->id);

        $review->replies()->create([
            'user_id' => $user->id,
            'comment' => trim($comment),
            'status' => 1,
        ]);

        $review = $review->fresh([
            'user:id,name,email,avatar',
            'user.roles',
            'orderItem.product.farm',
            'orderItem.product.category',
            'product.farm',
            'product.category',
            'orderItem.subOrder.order.user:id,name,email',
            'moderator:id,name,email',
            'replies.user.roles',
        ]);

        return $this->formatReview($review);
    }

    public function createProductComment(User $user, int $productId, string $comment): array
    {
        $farm = $this->getSellerFarm($user);
        $product = Product::query()
            ->where('farm_id', $farm->id)
            ->findOrFail($productId);

        $review = Review::create([
            'user_id' => $user->id,
            'order_item_id' => null,
            'product_id' => $product->id,
            'rating' => null,
            'comment' => trim($comment),
            'status' => 1,
        ]);

        return $this->formatReview($review->load([
            'user.roles',
            'product.farm',
            'replies.user.roles',
        ]));
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

    private function baseSellerReviewQuery(int $farmId)
    {
        return Review::query()
            ->where(function ($query) use ($farmId) {
                $query->whereHas('product', function ($q) use ($farmId) {
                    $q->where('farm_id', $farmId);
                })->orWhereHas('orderItem.product', function ($q) use ($farmId) {
                    $q->where('farm_id', $farmId);
                });
            });
    }

    private function baseSellerReplyQuery(int $farmId)
    {
        return ReviewReply::query()
            ->whereHas('review', function ($reviewQuery) use ($farmId) {
                $reviewQuery->where(function ($query) use ($farmId) {
                    $query->whereHas('product', function ($q) use ($farmId) {
                        $q->where('farm_id', $farmId);
                    })->orWhereHas('orderItem.product', function ($q) use ($farmId) {
                        $q->where('farm_id', $farmId);
                    });
                });
            });
    }

    private function ensureReviewBelongsToFarm(Review $review, int $farmId): void
    {
        $review->loadMissing(['product', 'orderItem.product']);

        $product = $review->product ?: $review->orderItem?->product;

        if ((int) $product?->farm_id !== (int) $farmId) {
            abort(403, 'Bạn không có quyền thao tác đánh giá này.');
        }
    }

    private function getStats(int $farmId): array
    {
        // Đánh giá = review có rating.
        $ratingReviews = $this->baseSellerReviewQuery($farmId)
            ->whereNotNull('rating');

        $ratingCounts = (clone $ratingReviews)
            ->selectRaw('rating, COUNT(*) as total')
            ->groupBy('rating')
            ->pluck('total', 'rating');

        // Bình luận gốc = reviews.comment có nội dung, kể cả review có sao.
        $directComments = $this->baseSellerReviewQuery($farmId)
            ->whereNotNull('comment')
            ->whereRaw("TRIM(comment) <> ''");

        // Mọi review_replies.comment thuộc sản phẩm của farm cũng là bình luận.
        $replyComments = $this->baseSellerReplyQuery($farmId)
            ->whereNotNull('comment')
            ->whereRaw("TRIM(comment) <> ''");

        $totalComments = (clone $directComments)->count()
            + (clone $replyComments)->count();

        $visibleComments = (clone $directComments)
            ->where('status', 1)
            ->count()
            + (clone $replyComments)
                ->where('status', 1)
                ->whereHas('review', function ($reviewQuery) {
                    $reviewQuery->where('status', 1);
                })
                ->count();

        return [
            'total_reviews' => (clone $ratingReviews)->count(),
            'visible_reviews' => (clone $ratingReviews)->where('status', 1)->count(),
            'hidden_reviews' => (clone $ratingReviews)->where('status', 0)->count(),
            'avg_rating' => round((float) (clone $ratingReviews)->avg('rating'), 1),
            'total_comments' => $totalComments,
            'visible_comments' => $visibleComments,
            'hidden_comments' => max(0, $totalComments - $visibleComments),

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
        $product = $review->product ?: $review->orderItem?->product;
        $author = $review->user ?: $review->orderItem?->subOrder?->order?->user;
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
            'status_label' => (int) $review->status === 1 ? 'Hiển thị' : 'Đã ẩn',
            'created_at' => optional($review->created_at)->format('d/m/Y H:i'),
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
                'avatar' => $author->avatar ?? null,
            ] : null,

            'buyer' => $author ? [
                'id' => $author->id,
                'name' => $author->name,
                'email' => $author->email,
                'avatar' => $author->avatar ?? null,
            ] : null,

            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug ?? null,
                'thumbnail' => $product->thumbnail ?? null,
                'thumbnail_url' => $product->thumbnail ?? null,
                'unit' => $product->unit ?? null,
                'is_publicly_visible' => $product->isPubliclyVisible(),
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
