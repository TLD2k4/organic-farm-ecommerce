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
            'VNPAY',
        ];

        $orders = Order::orderBy('id')->get();

        foreach ($orders as $order) {
            $method = $methods[($order->id - 1) % count($methods)];

            $paymentStatus = match ($order->status) {
                3 => 1, // Delivered => Paid
                4 => 3, // Cancelled => Refunded
                default => 0, // Pending
            };

            // Payment được tạo sau khi khách đặt hàng 10 phút
            $paymentDate = $order->created_at->copy()->addMinutes(10);

            // Nếu đơn đã giao thì xem như thanh toán hoàn tất tại thời điểm order hoàn tất
            $paidAt = $paymentStatus === 1
                ? $order->updated_at
                : null;

            // Nếu đã paid/refunded thì updated_at theo thời điểm trạng thái cuối của order
            $paymentUpdatedAt = in_array($paymentStatus, [1, 3])
                ? $order->updated_at
                : $paymentDate;

            Payment::create([
                'order_id' => $order->id,
                'transaction_code' => 'TXN' . str_pad($order->id, 8, '0', STR_PAD_LEFT),
                'payment_method' => $method,
                'amount' => $order->grand_total,
                'status' => $paymentStatus,
                'paid_at' => $paidAt,

                'created_at' => $paymentDate,
                'updated_at' => $paymentUpdatedAt,
            ]);
        }
    }
}