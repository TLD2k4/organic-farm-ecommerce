<?php

namespace App\Services\Order;

use App\Models\Order;
use Illuminate\Validation\ValidationException;

class OrderAggregateService
{
    /**
     * Tính lại tổng tiền hiện còn phải thanh toán từ các đơn con chưa hủy.
     * Giá trị gốc trên đơn con bị hủy vẫn được giữ để phục vụ lịch sử.
     * Hàm này được gọi bên trong transaction của thao tác hủy.
     */
    public function syncAmounts(Order $order): void
    {
        $lockedOrder = Order::query()
            ->lockForUpdate()
            ->findOrFail($order->id);

        $payment = $lockedOrder->payment()
            ->lockForUpdate()
            ->first();

        if ($payment && (int) $payment->status === 1) {
            throw ValidationException::withMessages([
                'payment' => [
                    'Không thể tính lại tiền của đơn đã thanh toán khi chưa xử lý hoàn tiền.',
                ],
            ]);
        }

        $activeSubOrders = $lockedOrder->subOrders()
            ->where('status', '!=', 4);

        $itemsTotal = round((float) (clone $activeSubOrders)->sum('items_total'), 2);
        $shippingFee = round((float) (clone $activeSubOrders)->sum('shipping_fee'), 2);
        $grandTotal = round((float) (clone $activeSubOrders)->sum('total'), 2);

        $lockedOrder->update([
            'items_total' => $itemsTotal,
            'shipping_fee' => $shippingFee,
            'grand_total' => $grandTotal,
        ]);

        $payment?->update([
            'amount' => $grandTotal,
        ]);
    }
}
