<?php

namespace App\Http\Controllers\Review;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\UpdateReviewStatusRequest;
use App\Models\Review;
use App\Services\Review\AdminReviewService;
use Illuminate\Http\Request;
use App\Notifications\MarketplaceNotification;

class AdminReviewController extends Controller
{
    public function __construct(private AdminReviewService $adminReviewService)
    {
    }

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $this->adminReviewService->getReviews($request->only([
                'keyword',
                'rating',
                'status',
                'deleted',
                'per_page',
                'page',
            ])),
        ]);
    }

    public function updateStatus(UpdateReviewStatusRequest $request, Review $review)
    {
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái đánh giá thành công.',
            'data' => $this->adminReviewService->updateStatus(
                $request->user(),
                $review,
                (int) $request->validated('status'),
                $request->validated('reason')
            ),
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $this->adminReviewService->destroy(
            $request->user(),
            $id,
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => 'Xóa đánh giá thành công.',
        ]);
    }

    public function restore(Request $request, int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Khôi phục đánh giá thành công.',
            'data' => $this->adminReviewService->restore($request->user(), $id),
        ]);
    }

    public function reply(Request $request, Review $review)
    {
        $validated = $request->validate([
            'comment' => ['required', 'string', 'max:2000'],
        ]);

        $data = $this->adminReviewService->reply(
            $request->user(),
            $review,
            $validated['comment']
        );

        $review->loadMissing('user');
        $review->user?->notify(new MarketplaceNotification(
            'review.replied_by_admin',
            'Quản trị viên đã trả lời đánh giá',
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

    public function createProductComment(Request $request, int $productId)
    {
        $validated = $request->validate([
            'comment' => ['required', 'string', 'max:2000'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đăng bình luận quản trị thành công.',
            'data' => $this->adminReviewService->createProductComment(
                $request->user(),
                $productId,
                $validated['comment']
            ),
        ], 201);
    }
}
