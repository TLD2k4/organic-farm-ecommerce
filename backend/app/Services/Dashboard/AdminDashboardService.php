<?php

namespace App\Services\Dashboard;

use App\Models\Farm;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    public function getOverview(int $days = 30): array
    {
        $startDate = now()
            ->subDays($days - 1)
            ->startOfDay();

        $endDate = now()->endOfDay();

        /*
         * Product có global scope farm_not_deleted.
         *
         * Dashboard admin cần đếm toàn bộ sản phẩm chưa xóa mềm,
         * kể cả sản phẩm thuộc farm đã bị xóa mềm.
         */
        $productQuery = Product::withoutGlobalScope('farm_not_deleted');

        $cards = [
            'total_users' => User::query()->count(),

            'total_farms' => Farm::query()->count(),

            'pending_farms' => Farm::query()
                ->where('status', 0)
                ->count(),

            'total_products' => (clone $productQuery)->count(),

            'active_products' => (clone $productQuery)
                ->where('status', 1)
                ->count(),

            'hidden_products' => (clone $productQuery)
                ->where('status', 3)
                ->count(),

            'total_orders' => Order::query()->count(),

            'today_orders' => Order::query()
                ->whereDate('created_at', today())
                ->count(),

            /*
             * Doanh thu chỉ tính payment đã thanh toán.
             * Không tính payment Pending, Failed, Refunded.
             */
            'total_revenue' => (float) Payment::query()
                ->where('status', 1)
                ->sum('amount'),

            'total_reviews' => Review::query()->count(),
        ];

        return [
            'period' => [
                'days' => $days,
                'from_date' => $startDate->toDateString(),
                'to_date' => $endDate->toDateString(),
            ],

            'cards' => $cards,

            'chart' => $this->buildDailyChart(
                $startDate,
                $endDate,
            ),

            'recent_orders' => $this->getRecentOrders(),

            'recent_farms' => $this->getRecentFarms(),
        ];
    }

    private function buildDailyChart(
        Carbon $startDate,
        Carbon $endDate
    ): array {
        $series = [];

        /*
         * Tạo sẵn từng ngày để ngày không có dữ liệu
         * vẫn trả về revenue = 0 và orders = 0.
         */
        foreach (
            CarbonPeriod::create(
                $startDate->copy()->startOfDay(),
                '1 day',
                $endDate->copy()->startOfDay()
            ) as $date
        ) {
            $key = $date->format('Y-m-d');

            $series[$key] = [
                'date' => $key,
                'label' => $date->format('d/m'),
                'revenue' => 0,
                'orders' => 0,
                'completed_orders' => 0,
                'cancelled_orders' => 0,
                'sub_orders' => 0,
                'processing_sub_orders' => 0,
                'completed_sub_orders' => 0,
                'cancelled_sub_orders' => 0,
            ];
        }

        /*
         * Doanh thu theo ngày thanh toán.
         */
        $payments = DB::table('payments')
            ->select([
                'paid_at',
                'amount',
            ])
            ->whereNull('deleted_at')
            ->where('status', 1)
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [
                $startDate,
                $endDate,
            ])
            ->get();

        foreach ($payments as $payment) {
            $key = Carbon::parse($payment->paid_at)
                ->format('Y-m-d');

            if (isset($series[$key])) {
                $series[$key]['revenue'] +=
                    (float) $payment->amount;
            }
        }

        /*
         * Số lượng đơn theo ngày tạo.
         */
        $orders = DB::table('orders')
            ->select([
                'created_at',
                'status',
            ])
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [
                $startDate,
                $endDate,
            ])
            ->get();

        foreach ($orders as $order) {
            $key = Carbon::parse($order->created_at)
                ->format('Y-m-d');

            if (!isset($series[$key])) {
                continue;
            }

            $series[$key]['orders']++;

            if ((int) $order->status === 3) {
                $series[$key]['completed_orders']++;
            }

            if ((int) $order->status === 4) {
                $series[$key]['cancelled_orders']++;
            }
        }

        /*
         * Vận hành của sàn đa gian hàng phải tính theo đơn con.
         * Một đơn tổng có thể đồng thời chứa gian hàng đang giao, đã hoàn
         * thành và đã hủy nên không thể suy ra cơ cấu từ status đơn tổng.
         */
        $subOrders = DB::table('sub_orders')
            ->select([
                'created_at',
                'status',
            ])
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [
                $startDate,
                $endDate,
            ])
            ->get();

        foreach ($subOrders as $subOrder) {
            $key = Carbon::parse($subOrder->created_at)
                ->format('Y-m-d');

            if (!isset($series[$key])) {
                continue;
            }

            $series[$key]['sub_orders']++;

            match ((int) $subOrder->status) {
                3 => $series[$key]['completed_sub_orders']++,
                4 => $series[$key]['cancelled_sub_orders']++,
                default => $series[$key]['processing_sub_orders']++,
            };
        }

        return array_values($series);
    }

    private function getRecentOrders(): array
    {
        return Order::query()
            ->with([
                'user' => function ($query) {
                    $query
                        ->withTrashed()
                        ->select([
                            'id',
                            'name',
                            'email',
                        ]);
                },

                'payment' => function ($query) {
                    $query
                        ->withTrashed()
                        ->select([
                            'id',
                            'order_id',
                            'payment_method',
                            'amount',
                            'status',
                            'paid_at',
                        ]);
                },
            ])
            ->latest('created_at')
            ->limit(5)
            ->get([
                'id',
                'user_id',
                'order_code',
                'grand_total',
                'status',
                'created_at',
            ])
            ->map(function (Order $order) {
                return [
                    'id' => $order->id,
                    'order_code' => $order->order_code,
                    'grand_total' => (float) $order->grand_total,
                    'status' => $order->status,
                    'created_at' => $order->created_at,

                    'user' => $order->user
                        ? [
                            'id' => $order->user->id,
                            'name' => $order->user->name,
                            'email' => $order->user->email,
                        ]
                        : null,

                    'payment' => $order->payment
                        ? [
                            'payment_method' =>
                            $order->payment->payment_method,

                            'amount' =>
                            (float) $order->payment->amount,

                            'status' =>
                            $order->payment->status,

                            'paid_at' =>
                            $order->payment->paid_at,
                        ]
                        : null,
                ];
            })
            ->values()
            ->all();
    }

    private function getRecentFarms(): array
    {
        return Farm::query()
            ->with([
                'seller' => function ($query) {
                    $query
                        ->withTrashed()
                        ->select([
                            'id',
                            'name',
                            'email',
                        ]);
                },
            ])
            ->latest('created_at')
            ->limit(5)
            ->get([
                'id',
                'seller_id',
                'name',
                'slug',
                'logo',
                'status',
                'approved_at',
                'created_at',
            ])
            ->map(function (Farm $farm) {
                return [
                    'id' => $farm->id,
                    'name' => $farm->name,
                    'slug' => $farm->slug,
                    'logo' => $farm->logo,
                    'status' => $farm->status,
                    'approved_at' => $farm->approved_at,
                    'created_at' => $farm->created_at,

                    'seller' => $farm->seller
                        ? [
                            'id' => $farm->seller->id,
                            'name' => $farm->seller->name,
                            'email' => $farm->seller->email,
                        ]
                        : null,
                ];
            })
            ->values()
            ->all();
    }
}
