<?php

namespace App\Http\Controllers\Review;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Http\Requests\Review\UpdateReviewRequest;
use App\Models\Review;
use App\Services\Review\ReviewService;
use Illuminate\Http\Request;

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

    public function store(StoreReviewRequest $request)
    {
        $review = $this->reviewService->create(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Đánh giá sản phẩm thành công.',
            'data' => [
                'review' => $review,
            ],
        ], 201);
    }

    public function update(UpdateReviewRequest $request, Review $review)
    {
        $review = $this->reviewService->update(
            $request->user(),
            $review,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật đánh giá thành công.',
            'data' => [
                'review' => $review,
            ],
        ]);
    }

    public function destroy(Request $request, Review $review)
    {
        $this->reviewService->delete($request->user(), $review);

        return response()->json([
            'success' => true,
            'message' => 'Xóa đánh giá thành công.',
        ]);
    }
}