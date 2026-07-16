<?php

namespace App\Http\Controllers\Review;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Http\Requests\Review\UpdateReviewRequest;
use App\Models\Review;
use App\Services\Review\ReviewService;
use Illuminate\Http\Request;
use App\Notifications\MarketplaceNotification;

class ReviewController extends Controller
{
    public function __construct(
        private ReviewService $reviewService
    ) {}

    public function myReviews(Request $request)
    {
        $reviews = $this->reviewService->getMyReviews($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đánh giá thành công.',
            'data' => [
                'reviews' => $reviews,
            ],
        ]);
    }

    public function reviewableItems(Request $request)
    {
        $items = $this->reviewService->getReviewableItems($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách sản phẩm chờ đánh giá thành công.',
            'data' => [
                'items' => $items,
            ],
        ]);
    }

    public function eligibility(Request $request)
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ], [
            'product_id.required' => 'Vui lòng chọn sản phẩm cần kiểm tra.',
            'product_id.exists' => 'Sản phẩm không tồn tại.',
        ]);

        $eligibility = $this->reviewService->getProductEligibility(
            $request->user(),
            (int) $validated['product_id']
        );

        return response()->json([
            'success' => true,
            'message' => 'Kiểm tra quyền đánh giá và bình luận thành công.',
            'data' => $eligibility,
        ]);
    }

    public function store(StoreReviewRequest $request)
    {
        $review = $this->reviewService->create(
            $request->user(),
            $request->validated()
        );

        $reviewModel = Review::query()
            ->with('product.farm.seller')
            ->find($review['id']);

        $isRatingReview = (bool) ($review['is_rating_review'] ?? false);
        $entryLabel = $isRatingReview ? 'đánh giá' : 'bình luận';

        $reviewModel?->product?->farm?->seller?->notify(
            new MarketplaceNotification(
                'review.created',
                $isRatingReview
                    ? 'Sản phẩm có đánh giá mới'
                    : 'Sản phẩm có bình luận mới',
                ($request->user()->name ?? 'Khách hàng')
                    . " vừa {$entryLabel} về sản phẩm "
                    . ($reviewModel?->product?->name ?? '') . '.',
                '/seller/reviews',
                $request->user(),
                ['review_id' => $review['id']]
            )
        );

        return response()->json([
            'success' => true,
            'message' => $isRatingReview
                ? 'Đánh giá sản phẩm thành công.'
                : 'Bình luận sản phẩm thành công.',
            'data' => [
                'review' => $review,
            ],
        ], 201);
    }

    public function update(UpdateReviewRequest $request, Review $review)
    {
        $isRatingReview = $review->order_item_id !== null
            && $review->rating !== null;

        $review = $this->reviewService->update(
            $request->user(),
            $review,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => $isRatingReview
                ? 'Cập nhật đánh giá thành công.'
                : 'Cập nhật bình luận thành công.',
            'data' => [
                'review' => $review,
            ],
        ]);
    }

    public function destroy(Request $request, Review $review)
    {
        $isRatingReview = $review->order_item_id !== null
            && $review->rating !== null;

        $this->reviewService->delete($request->user(), $review);

        return response()->json([
            'success' => true,
            'message' => $isRatingReview
                ? 'Xóa đánh giá thành công.'
                : 'Xóa bình luận thành công.',
        ]);
    }
}
