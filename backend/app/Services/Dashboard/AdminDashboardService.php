<?php

namespace App\Services\Dashboard;

use App\Models\Farm;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\ReviewReply;
use App\Models\User;
use App\Services\Revenue\RevenueMetricsService;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    public function __construct(
        private RevenueMetricsService $revenueMetrics,
    ) {}

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

        $revenueTotals = $this->revenueMetrics->totals();

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
             * Doanh thu chuẩn = tổng tiền của đơn con đã hoàn tất và đã
             * thanh toán. Không dùng payment/order cha vì đơn đa farm có
             * thể có một phần hoàn tất và một phần bị hủy.
             */
            'total_revenue' => $revenueTotals['total_revenue'],
            'items_revenue' => $revenueTotals['items_revenue'],
            'shipping_revenue' => $revenueTotals['shipping_revenue'],
            // Đánh giá = mọi review có chấm sao.
            'total_reviews' => Review::query()
                ->whereNotNull('rating')
                ->count(),

            // Bình luận = reviews.comment có nội dung + review_replies.comment.
            'total_comments' => Review::query()
                ->whereNotNull('comment')
                ->whereRaw("TRIM(comment) <> ''")
                ->count()
                + ReviewReply::query()
                    ->whereHas('review')
                    ->whereNotNull('comment')
                    ->whereRaw("TRIM(comment) <> ''")
                    ->count(),
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
                'pending_sub_orders' => 0,
                'preparing_sub_orders' => 0,
                'shipping_sub_orders' => 0,
                'completed_sub_orders' => 0,
                'cancelled_sub_orders' => 0,
            ];
        }

        /*
         * Doanh thu theo ngày đơn con hoàn tất. Cùng nguồn dữ liệu với thẻ
         * tổng doanh thu và trang quản trị đơn hàng.
         */
        $revenueDateExpression = $this->revenueMetrics
            ->recognizedAtExpression();

        $recognizedSubOrders = $this->revenueMetrics
            ->completedPaidSubOrders(null, $startDate, $endDate)
            ->selectRaw("DATE({$revenueDateExpression}) as revenue_date")
            ->selectRaw('COALESCE(SUM(sub_orders.total), 0) as revenue')
            ->groupBy(DB::raw("DATE({$revenueDateExpression})"))
            ->get();

        foreach ($recognizedSubOrders as $row) {
            $key = Carbon::parse($row->revenue_date)
                ->format('Y-m-d');

            if (isset($series[$key])) {
                $series[$key]['revenue'] = (float) $row->revenue;
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

            $status = (int) $subOrder->status;

            match ($status) {
                0 => $series[$key]['pending_sub_orders']++,
                1 => $series[$key]['preparing_sub_orders']++,
                2 => $series[$key]['shipping_sub_orders']++,
                3 => $series[$key]['completed_sub_orders']++,
                4 => $series[$key]['cancelled_sub_orders']++,
                default => null,
            };

            if (in_array($status, [0, 1, 2], true)) {
                $series[$key]['processing_sub_orders']++;
            }
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
