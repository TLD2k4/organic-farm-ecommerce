<?php

namespace App\Http\Controllers\Review;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\UpdateReviewStatusRequest;
use App\Models\Review;
use App\Services\Review\SellerReviewService;
use Illuminate\Http\Request;
use App\Notifications\MarketplaceNotification;

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
            (int) $request->validated('status'),
            $request->validated('reason')
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái đánh giá thành công.',
            'data' => [
                'review' => $review,
            ],
        ]);
    }

    public function reply(Request $request, Review $review)
    {
        $validated = $request->validate([
            'comment' => ['required', 'string', 'max:2000'],
        ]);

        $data = $this->sellerReviewService->reply(
            $request->user(),
            $review,
            $validated['comment']
        );

        $review->loadMissing('user');
        $review->user?->notify(new MarketplaceNotification(
            'review.replied',
            'Người bán đã trả lời đánh giá',
            trim($validated['comment']),
            '/profile?tab=reviews',
            $request->user(),
            ['review_id' => $review->id]
        ));

        return response()->json([
            'success' => true,
            'message' => 'Trả lời đánh giá thành công.',
            'data' => $data,
        ], 201);
    }

    public function createProductComment(Request $request, int $product)
    {
        $validated = $request->validate([
            'comment' => ['required', 'string', 'max:2000'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã đăng bình luận của người bán.',
            'data' => $this->sellerReviewService->createProductComment(
                $request->user(), $product, $validated['comment']
            ),
        ], 201);
    }
}
