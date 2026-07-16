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
                'type' => $request->query('type'),
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

        $reviewModel = Review::query()
            ->with(['user', 'product', 'orderItem.product'])
            ->find($review['id']);
        if ($reviewModel?->user && (int) $reviewModel->user_id !== (int) $request->user()->id) {
            $reason = $request->validated('reason');
            $message = $request->user()->name . ' đã thực hiện thao tác lúc '
                . now()->format('d/m/Y H:i') . '.';
            if (filled($reason)) {
                $message .= ' Lý do: ' . trim($reason);
            }

            $product = $reviewModel->product ?: $reviewModel->orderItem?->product;
            $url = $reviewModel->order_item_id
                ? '/profile?tab=reviews&review_id=' . $reviewModel->id
                : ($product ? '/products/' . ($product->slug ?: $product->id) : '/');

            $reviewModel->user->notify(new MarketplaceNotification(
                'review.moderated_by_seller',
                (int) $request->validated('status') === 1
                    ? 'Nội dung của bạn đã được hiển thị lại'
                    : 'Nội dung của bạn đã bị người bán ẩn',
                $message,
                $url,
                $request->user(),
                ['review_id' => $reviewModel->id]
            ));
        }

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

        $review->loadMissing(['user', 'product', 'orderItem.product']);
        if ((int) $review->user_id !== (int) $request->user()->id) {
            $product = $review->product ?: $review->orderItem?->product;
            $url = $review->order_item_id
                ? '/profile?tab=reviews&review_id=' . $review->id
                : ($product ? '/products/' . ($product->slug ?: $product->id) : '/');
            $review->user?->notify(new MarketplaceNotification(
            'review.replied',
            $review->order_item_id ? 'Người bán đã trả lời đánh giá' : 'Người bán đã trả lời bình luận',
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
