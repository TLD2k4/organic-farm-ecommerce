<?php

namespace Database\Seeders;

use App\Models\Order;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        for ($i = 1; $i <= 30; $i++) {
            $userId = (($i - 1) % 16) + 1;

            // AddressSeeder: mỗi user có 2 địa chỉ
            // địa chỉ mặc định của user = (user_id - 1) * 2 + 1
            $addressId = (($userId - 1) * 2) + 1;

            // Tạo đơn trong vòng 30 ngày gần đây
            $orderDate = now()
                ->subDays(30 - $i)
                ->setTime(8 + ($i % 10), ($i * 7) % 60, 0);

            // Đơn cũ thường đã giao, đơn mới thường đang xử lý/chờ xác nhận
            if ($i <= 14) {
                $status = 3; // Delivered
            } elseif ($i <= 18) {
                $status = 2; // Shipping
            } elseif ($i <= 23) {
                $status = 1; // Processing
            } elseif ($i <= 27) {
                $status = 0; // Pending
            } else {
                $status = 4; // Cancelled
            }

            Order::create([
                'user_id' => $userId,
                'address_id' => $addressId,
                'order_code' => 'ORD' . str_pad($i, 6, '0', STR_PAD_LEFT),

                'shipping_name' => 'Người nhận đơn ' . $i,
                'shipping_phone' => '098' . str_pad($i, 7, '0', STR_PAD_LEFT),
                'shipping_address' => 'Địa chỉ giao hàng mẫu số ' . $i . ', Việt Nam',

                'shipping_fee' => 0,
                'items_total' => 0,
                'grand_total' => 0,

                'status' => $status,

                'created_at' => $orderDate,
                'updated_at' => $orderDate,
            ]);
        }
    }
}