<?php

namespace Database\Seeders;

use App\Models\OrderItem;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::role('admin')->value('id');

        $comments = [
            'Sản phẩm rất tươi, đóng gói cẩn thận.',
            'Giao hàng nhanh, chất lượng đúng mô tả.',
            'Rau còn xanh và sạch, rất hài lòng.',
            'Giá hợp lý, sản phẩm đáng mua.',
            'Nông sản tươi ngon, sẽ tiếp tục ủng hộ.',
            'Đóng gói chắc chắn, giao đúng hẹn.',
            'Chất lượng tốt hơn mong đợi.',
            'Sản phẩm sạch, phù hợp cho gia đình.',
            'Hàng nhận được còn rất mới.',
            'Dịch vụ tốt, người bán hỗ trợ nhanh.',
            'Trái cây ngọt và tươi.',
            'Gạo thơm, nấu cơm rất ngon.',
            'Hạt dinh dưỡng đóng hộp sạch sẽ.',
            'Bột nguyên chất, dùng rất ổn.',
            'Rất hài lòng với đơn hàng này.',
            'Sản phẩm đúng hình ảnh và mô tả.',
            'Sẽ giới thiệu cho bạn bè.',
            'Đơn hàng giao nhanh hơn dự kiến.',
            'Chất lượng ổn định.',
            'Mua lần sau vẫn chọn nông trại này.',
            'Bao bì đẹp, sản phẩm sạch.',
            'Rau củ không bị dập.',
            'Giá hơi cao nhưng chất lượng tốt.',
            'Hàng tươi, dùng trong ngày rất ngon.',
            'Tổng thể rất hài lòng.',
        ];

        $orderItems = OrderItem::whereHas('subOrder.order', function ($query) {
                $query->where('status', 3); // Đơn cha đã hoàn thành
            })
            ->whereHas('subOrder', function ($query) {
                $query->where('status', 3)
                    ->where('payment_status', 1)
                    ->whereNotNull('completed_at');
            })
            ->with('subOrder.order')
            ->get()
            // Một sản phẩm trong một đơn chỉ có một lượt đánh giá,
            // không phụ thuộc số lượng hoặc số dòng dữ liệu lặp.
            ->unique(fn (OrderItem $item) => $item->subOrder->order_id . ':' . $item->product_id)
            ->take(25)
            ->values();

        foreach ($orderItems as $index => $orderItem) {
            $order = $orderItem->subOrder->order;
            $isHidden = $index > 0 && $index % 6 === 0;

            // Review tạo sau khi đơn đã giao
            $reviewDate = $order->updated_at->copy()->addHours($index + 1);

            Review::create([
                'user_id' => $order->user_id,
                'order_item_id' => $orderItem->id,
                'product_id' => $orderItem->product_id,
                'rating' => $index % 2 === 0 ? 5 : 4,
                'comment' => $comments[$index],
                'status' => $isHidden ? 0 : 1,
                'moderated_by' => $isHidden ? $adminId : null,
                'moderated_at' => $isHidden ? $reviewDate->copy()->addHour() : null,
                'moderation_reason' => $isHidden
                    ? 'Nội dung mẫu được ẩn để kiểm thử chức năng kiểm duyệt.'
                    : null,

                'created_at' => $reviewDate,
                'updated_at' => $reviewDate,
            ]);
        }
    }
}
