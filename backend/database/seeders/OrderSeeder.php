<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $customerIds = User::role('customer')
            ->orderBy('id')
            ->pluck('id')
            ->values();

        if ($customerIds->isEmpty()) {
            return;
        }

        for ($i = 1; $i <= 30; $i++) {
            $userId = (int) $customerIds[($i - 1) % $customerIds->count()];

            $addressId = User::findOrFail($userId)
                ->addresses()
                ->where('is_default', true)
                ->value('id');

            if (!$addressId) {
                continue;
            }

            $dayOffset = $i === 1 ? 0 : (($i - 1) % 30);
            $orderDate = today()->subDays($dayOffset)
                ->setTime(8 + ($i % 10), ($i * 7) % 60, 0);
            if ($orderDate->isFuture()) $orderDate = now();

            // Đơn cũ thường đã giao, đơn mới thường đang xử lý/chờ xác nhận
            if ($dayOffset >= 10) {
                $status = 3; // Delivered
            } elseif ($dayOffset >= 5) {
                $status = 2; // Shipping
            } elseif ($dayOffset >= 2) {
                $status = 1; // Processing
            } elseif ($i % 3 !== 0) {
                $status = 0; // Pending
            } else {
                $status = 4; // Cancelled
            }

            Order::updateOrCreate(['order_code' => 'ORD' . str_pad($i, 6, '0', STR_PAD_LEFT)], [
                'user_id' => $userId,
                'address_id' => $addressId,
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
