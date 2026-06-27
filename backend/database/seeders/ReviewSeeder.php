<?php

namespace Database\Seeders;

use App\Models\OrderItem;
use App\Models\Review;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
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
                $query->where('status', 3); // Chỉ đơn đã giao mới được đánh giá
            })
            ->with('subOrder.order')
            ->limit(25)
            ->get();

        foreach ($orderItems as $index => $orderItem) {
            $order = $orderItem->subOrder->order;

            // Review tạo sau khi đơn đã giao
            $reviewDate = $order->updated_at->copy()->addHours($index + 1);

            Review::create([
                'user_id' => $order->user_id,
                'order_item_id' => $orderItem->id,
                'rating' => $index % 2 === 0 ? 5 : 4,
                'comment' => $comments[$index],
                'status' => 1,

                'created_at' => $reviewDate,
                'updated_at' => $reviewDate,
            ]);
        }
    }
}