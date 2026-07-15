<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Farm;
use App\Models\SubOrder;
use Illuminate\Database\Seeder;

class SubOrderSeeder extends Seeder
{
    public function run(): void
    {
        $orders = Order::query()->orderBy('created_at')->orderBy('id')->get();
        $farmIds = Farm::query()->where('status', 1)->orderBy('id')->pluck('id')->values();

        if ($orders->isEmpty() || $farmIds->isEmpty()) return;

        foreach ($orders as $orderIndex => $order) {

            // Order lẻ có 1 sub_order, order chẵn có 2 sub_orders
            $numberOfSubOrders = $orderIndex % 2 === 0 ? 1 : min(2, $farmIds->count());

            for ($j = 1; $j <= $numberOfSubOrders; $j++) {
                $farmId = (int) $farmIds[($orderIndex + $j - 1) % $farmIds->count()];

                // Sub order lấy trạng thái theo order cha
                $status = $order->status;

                $paymentStatus = match ($status) {
                    3 => 1, // Delivered => Paid
                    4 => 3, // Cancelled => Refunded
                    default => 0, // Pending
                };

                // Sub order được tạo sau order cha vài phút
                $subOrderDate = $order->created_at->copy()->addMinutes($j);

                SubOrder::updateOrCreate([
                    'sub_order_code' => 'SUB-' . $order->order_code . '-' . $j,
                ], [
                    'order_id' => $order->id,
                    'farm_id' => $farmId,

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

            }
        }
    }
}
