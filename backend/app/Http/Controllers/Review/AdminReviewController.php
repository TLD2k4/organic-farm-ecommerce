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
                'type',
                'status',
                'deleted',
                'per_page',
                'page',
            ])),
        ]);
    }

    public function updateStatus(UpdateReviewStatusRequest $request, Review $review)
    {
        $data = $this->adminReviewService->updateStatus(
            $request->user(),
            $review,
            (int) $request->validated('status'),
            $request->validated('reason')
        );

        $this->notifyModeration(
            $review->fresh('user'),
            $request->user(),
            (int) $request->validated('status') === 1
                ? 'Nội dung của bạn đã được hiển thị lại'
                : 'Nội dung của bạn đã bị ẩn',
            $request->validated('reason')
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái nội dung thành công.',
            'data' => $data,
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $review = Review::query()->with('user')->findOrFail($id);

        $this->adminReviewService->destroy(
            $request->user(),
            $id,
            $validated['reason']
        );

        $this->notifyModeration(
            $review,
            $request->user(),
            'Nội dung của bạn đã bị quản trị viên xóa',
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => 'Xóa đánh giá thành công.',
        ]);
    }

    public function restore(Request $request, int $id)
    {
        $review = Review::withTrashed()->with('user')->findOrFail($id);
        $data = $this->adminReviewService->restore($request->user(), $id);
        $this->notifyModeration(
            $review,
            $request->user(),
            'Nội dung của bạn đã được khôi phục'
        );

        return response()->json([
            'success' => true,
            'message' => 'Khôi phục đánh giá thành công.',
            'data' => $data,
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

        $review->loadMissing(['user', 'product', 'orderItem.product']);
        if ((int) $review->user_id !== (int) $request->user()->id) {
            $product = $review->product ?: $review->orderItem?->product;
            $url = $review->order_item_id
                ? '/profile?tab=reviews&review_id=' . $review->id
                : ($product ? '/products/' . ($product->slug ?: $product->id) : '/');
            $review->user?->notify(new MarketplaceNotification(
            'review.replied_by_admin',
            $review->order_item_id ? 'Quản trị viên đã trả lời đánh giá' : 'Quản trị viên đã trả lời bình luận',
            trim($validated['comment']),
            $url,
            $request->user(),
            ['review_id' => $review->id]
            ));
        }

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

    private function notifyModeration(
        ?Review $review,
        $actor,
        string $title,
        ?string $reason = null
    ): void {
        if (!$review?->user || (int) $review->user_id === (int) $actor->id) {
            return;
        }

        $review->loadMissing(['product', 'orderItem.product']);
        $product = $review->product ?: $review->orderItem?->product;
        $url = $review->order_item_id
            ? '/profile?tab=reviews&review_id=' . $review->id
            : ($product ? '/products/' . ($product->slug ?: $product->id) : '/');

        $message = $actor->name . ' đã thực hiện thao tác lúc '
            . now()->format('d/m/Y H:i') . '.';

        if (filled($reason)) {
            $message .= ' Lý do: ' . trim($reason);
        }

        $review->user->notify(new MarketplaceNotification(
            'review.moderated',
            $title,
            $message,
            $url,
            $actor,
            ['review_id' => $review->id]
        ));
    }
}
