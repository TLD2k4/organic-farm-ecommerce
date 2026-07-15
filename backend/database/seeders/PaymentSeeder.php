<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            'COD',
            'MOMO',
        ];

        $orders = Order::orderBy('id')->get();

        foreach ($orders as $order) {
            $method = $methods[($order->id - 1) % count($methods)];

            $paymentStatus = match ((int) $order->status) {
                3 => 1,
                2, 1 => $method === 'MOMO' ? 1 : 0,
                4 => $method === 'MOMO' ? 3 : 2,
                default => 0,
            };

            // Payment được tạo sau khi khách đặt hàng 10 phút
            $paymentDate = $order->created_at->copy()->addMinutes(10);

            // Nếu đơn đã giao thì xem như thanh toán hoàn tất tại thời điểm order hoàn tất
            $paidAt = match ($paymentStatus) {
                1 => $order->updated_at,
                3 => $order->created_at->copy()->addMinutes(20),
                default => null,
            };

            // Nếu đã paid/refunded thì updated_at theo thời điểm trạng thái cuối của order
            $paymentUpdatedAt = in_array($paymentStatus, [1, 3])
                ? $order->updated_at
                : $paymentDate;

            $payment = Payment::create([
                'order_id' => $order->id,
                'transaction_code' => ($method === 'MOMO' ? 'MOMO-SANDBOX-' : 'COD-')
                    . str_pad($order->id, 8, '0', STR_PAD_LEFT),
                'payment_method' => $method,
                'amount' => $order->grand_total,
                'status' => $paymentStatus,
                'paid_at' => $paidAt,

                'created_at' => $paymentDate,
                'updated_at' => $paymentUpdatedAt,
            ]);

            $order->subOrders()->update([
                'payment_status' => $payment->status,
            ]);
        }
    }
}
