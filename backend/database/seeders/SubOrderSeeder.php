<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\SubOrder;
use Illuminate\Database\Seeder;

class SubOrderSeeder extends Seeder
{
    public function run(): void
    {
        $subOrderIndex = 1;

        for ($orderId = 1; $orderId <= 30; $orderId++) {
            $order = Order::find($orderId);

            if (!$order) {
                continue;
            }

            // Order lẻ có 1 sub_order, order chẵn có 2 sub_orders
            $numberOfSubOrders = $orderId % 2 === 0 ? 2 : 1;

            for ($j = 1; $j <= $numberOfSubOrders; $j++) {
                $farmId = (($orderId + $j - 2) % 5) + 1;

                // Sub order lấy trạng thái theo order cha
                $status = $order->status;

                $paymentStatus = match ($status) {
                    3 => 1, // Delivered => Paid
                    4 => 3, // Cancelled => Refunded
                    default => 0, // Pending
                };

                // Sub order được tạo sau order cha vài phút
                $subOrderDate = $order->created_at->copy()->addMinutes($j);

                SubOrder::create([
                    'order_id' => $orderId,
                    'farm_id' => $farmId,
                    'sub_order_code' => 'SUB' . str_pad($subOrderIndex, 6, '0', STR_PAD_LEFT),

                    // Ban đầu chưa tính item, OrderItemSeeder sẽ cập nhật lại
                    'items_total' => 0,
                    'shipping_fee' => 15000,
                    'total' => 15000,

                    'status' => $status,
                    'payment_status' => $paymentStatus,
                    'seller_note' => null,

                    'created_at' => $subOrderDate,
                    'updated_at' => $subOrderDate,
                ]);

                $subOrderIndex++;
            }
        }
    }
}