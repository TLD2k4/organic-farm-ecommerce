<?php

namespace App\Services\Order;

use App\Models\Order;
use App\Models\SubOrder;
use App\Models\Payment;

class OrderCodeService
{
    /**
     * ORD250700001
     */
    public function generateOrderCode(): string
    {
        do {

            $code = 'ORD'
                . now()->format('ym')
                . str_pad(
                    random_int(1, 99999),
                    5,
                    '0',
                    STR_PAD_LEFT
                );

        } while (
            Order::where('order_code', $code)->exists()
        );

        return $code;
    }

    /**
     * SUB250700001
     */
    public function generateSubOrderCode(): string
    {
        do {

            $code = 'SUB'
                . now()->format('ym')
                . str_pad(
                    random_int(1, 99999),
                    5,
                    '0',
                    STR_PAD_LEFT
                );

        } while (
            SubOrder::where(
                'sub_order_code',
                $code
            )->exists()
        );

        return $code;
    }

    /**
     * PAY202607011230009999
     */
    public function generateTransactionCode(): string
    {
        do {

            $code =
                'PAY'
                . now()->format('YmdHis')
                . random_int(1000, 9999);

        } while (
            Payment::where(
                'transaction_code',
                $code
            )->exists()
        );

        return $code;
    }
}