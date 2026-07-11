<?php

namespace App\Http\Controllers\Review;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\UpdateReviewStatusRequest;
use App\Models\Review;
use App\Services\Review\SellerReviewService;
use Illuminate\Http\Request;

class SellerReviewController extends Controller
{
    public function __construct(
        private SellerReviewService $sellerReviewService
    ) {}

    public function index(Request $request)
    {
        $result = $this->sellerReviewService->getReviews(
            $request->user(),
            [
                'keyword' => $request->query('keyword'),
                'rating' => $request->query('rating'),
                'status' => $request->query('status'),
                'page' => $request->query('page', 1),
                'limit' => $request->query('limit', 5),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đánh giá gian hàng thành công.',
            'data' => $result,
        ]);
    }

    public function updateStatus(UpdateReviewStatusRequest $request, Review $review)
    {
        $review = $this->sellerReviewService->updateStatus(
            $request->user(),
            $review,
            (int) $request->validated('status')
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái đánh giá thành công.',
            'data' => [
                'review' => $review,
            ],
        ]);
    }
}