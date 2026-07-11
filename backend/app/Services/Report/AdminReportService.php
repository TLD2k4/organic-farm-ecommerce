<?php

namespace App\Services\Report;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminReportService
{
    public function getReport(array $filters): array
    {
        $startDate = !empty($filters['from_date'])
            ? Carbon::parse($filters['from_date'])->startOfDay()
            : now()->subDays(29)->startOfDay();

        $endDate = !empty($filters['to_date'])
            ? Carbon::parse($filters['to_date'])->endOfDay()
            : now()->endOfDay();

        $groupBy = $filters['group_by']
            ?? $this->guessGroupBy($startDate, $endDate);

        $limit = (int) ($filters['limit'] ?? 10);

        return [
            'filters' => [
                'from_date' => $startDate->toDateString(),
                'to_date' => $endDate->toDateString(),
                'group_by' => $groupBy,
                'limit' => $limit,
            ],

            'summary' => $this->getSummary(
                $startDate,
                $endDate,
            ),

            'chart' => $this->getChart(
                $startDate,
                $endDate,
                $groupBy,
            ),

            'top_products' => $this->getTopProducts(
                $startDate,
                $endDate,
                $limit,
            ),

            'top_categories' => $this->getTopCategories(
                $startDate,
                $endDate,
                $limit,
            ),

            'top_farms' => $this->getTopFarms(
                $startDate,
                $endDate,
                $limit,
            ),
        ];
    }

    private function getSummary(
        Carbon $startDate,
        Carbon $endDate
    ): array {
        $orderQuery = DB::table('orders')
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [
                $startDate,
                $endDate,
            ]);

        $totalOrders = (clone $orderQuery)->count();

        $completedOrders = (clone $orderQuery)
            ->where('status', 3)
            ->count();

        $cancelledOrders = (clone $orderQuery)
            ->where('status', 4)
            ->count();

        $paymentQuery = DB::table('payments')
            ->whereNull('deleted_at')
            ->where('status', 1)
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [
                $startDate,
                $endDate,
            ]);

        $paidOrders = (clone $paymentQuery)->count();

        $revenue = (float) (clone $paymentQuery)
            ->sum('amount');

        $newUsers = DB::table('users')
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [
                $startDate,
                $endDate,
            ])
            ->count();

        $totalItemsSold = (float) DB::table('order_items as oi')
            ->join(
                'sub_orders as so',
                'so.id',
                '=',
                'oi.sub_order_id'
            )
            ->join(
                'orders as o',
                'o.id',
                '=',
                'so.order_id'
            )
            ->join(
                'payments as pay',
                'pay.order_id',
                '=',
                'o.id'
            )
            ->whereNull('so.deleted_at')
            ->whereNull('o.deleted_at')
            ->whereNull('pay.deleted_at')
            ->where('pay.status', 1)
            ->whereBetween('pay.paid_at', [
                $startDate,
                $endDate,
            ])
            ->sum('oi.quantity');

        return [
            'revenue' => $revenue,

            'total_orders' => $totalOrders,

            'paid_orders' => $paidOrders,

            'completed_orders' => $completedOrders,

            'cancelled_orders' => $cancelledOrders,

            'average_order_value' => $paidOrders > 0
                ? round($revenue / $paidOrders, 2)
                : 0,

            'completion_rate' => $totalOrders > 0
                ? round(
                    ($completedOrders / $totalOrders) * 100,
                    2
                )
                : 0,

            'cancellation_rate' => $totalOrders > 0
                ? round(
                    ($cancelledOrders / $totalOrders) * 100,
                    2
                )
                : 0,

            'new_users' => $newUsers,

            'total_items_sold' => $totalItemsSold,
        ];
    }

    private function getChart(
        Carbon $startDate,
        Carbon $endDate,
        string $groupBy
    ): array {
        $series = $this->createEmptySeries(
            $startDate,
            $endDate,
            $groupBy,
        );

        /*
         * Revenue và số đơn đã thanh toán.
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
            $date = Carbon::parse($payment->paid_at);

            $key = $this->periodKey(
                $date,
                $groupBy,
            );

            if (!isset($series[$key])) {
                continue;
            }

            $series[$key]['revenue'] +=
                (float) $payment->amount;

            $series[$key]['paid_orders']++;
        }

        /*
         * Tổng đơn, hoàn thành và hủy.
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
            $date = Carbon::parse($order->created_at);

            $key = $this->periodKey(
                $date,
                $groupBy,
            );

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
         * Người dùng mới.
         */
        $users = DB::table('users')
            ->select('created_at')
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [
                $startDate,
                $endDate,
            ])
            ->get();

        foreach ($users as $user) {
            $date = Carbon::parse($user->created_at);

            $key = $this->periodKey(
                $date,
                $groupBy,
            );

            if (isset($series[$key])) {
                $series[$key]['new_users']++;
            }
        }

        return array_values($series);
    }

    private function getTopProducts(
        Carbon $startDate,
        Carbon $endDate,
        int $limit
    ): array {
        return DB::table('order_items as oi')
            ->join(
                'sub_orders as so',
                'so.id',
                '=',
                'oi.sub_order_id'
            )
            ->join(
                'orders as o',
                'o.id',
                '=',
                'so.order_id'
            )
            ->join(
                'payments as pay',
                'pay.order_id',
                '=',
                'o.id'
            )
            ->whereNull('so.deleted_at')
            ->whereNull('o.deleted_at')
            ->whereNull('pay.deleted_at')
            ->where('pay.status', 1)
            ->whereBetween('pay.paid_at', [
                $startDate,
                $endDate,
            ])
            ->select([
                'oi.product_id',
                'oi.product_name',
                'oi.product_image',
                'oi.unit',
            ])
            ->selectRaw(
                'SUM(oi.quantity) as quantity_sold'
            )
            ->selectRaw(
                'SUM(oi.subtotal) as revenue'
            )
            ->selectRaw(
                'COUNT(DISTINCT o.id) as order_count'
            )
            ->groupBy([
                'oi.product_id',
                'oi.product_name',
                'oi.product_image',
                'oi.unit',
            ])
            ->orderByDesc('quantity_sold')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'product_image' => $item->product_image,
                    'unit' => $item->unit,

                    'quantity_sold' =>
                    (float) $item->quantity_sold,

                    'revenue' =>
                    (float) $item->revenue,

                    'order_count' =>
                    (int) $item->order_count,
                ];
            })
            ->values()
            ->all();
    }

    private function getTopCategories(
        Carbon $startDate,
        Carbon $endDate,
        int $limit
    ): array {
        return DB::table('order_items as oi')
            ->join(
                'products as p',
                'p.id',
                '=',
                'oi.product_id'
            )
            ->join(
                'categories as c',
                'c.id',
                '=',
                'p.category_id'
            )
            ->join(
                'sub_orders as so',
                'so.id',
                '=',
                'oi.sub_order_id'
            )
            ->join(
                'orders as o',
                'o.id',
                '=',
                'so.order_id'
            )
            ->join(
                'payments as pay',
                'pay.order_id',
                '=',
                'o.id'
            )
            ->whereNull('so.deleted_at')
            ->whereNull('o.deleted_at')
            ->whereNull('pay.deleted_at')
            ->where('pay.status', 1)
            ->whereBetween('pay.paid_at', [
                $startDate,
                $endDate,
            ])
            ->select([
                'c.id',
                'c.name',
            ])
            ->selectRaw(
                'SUM(oi.quantity) as quantity_sold'
            )
            ->selectRaw(
                'SUM(oi.subtotal) as revenue'
            )
            ->selectRaw(
                'COUNT(DISTINCT o.id) as order_count'
            )
            ->groupBy([
                'c.id',
                'c.name',
            ])
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'category_id' => $item->id,
                    'category_name' => $item->name,

                    'quantity_sold' =>
                    (float) $item->quantity_sold,

                    'revenue' =>
                    (float) $item->revenue,

                    'order_count' =>
                    (int) $item->order_count,
                ];
            })
            ->values()
            ->all();
    }

    private function getTopFarms(
        Carbon $startDate,
        Carbon $endDate,
        int $limit
    ): array {
        return DB::table('sub_orders as so')
            ->join(
                'farms as f',
                'f.id',
                '=',
                'so.farm_id'
            )
            ->join(
                'payments as pay',
                'pay.order_id',
                '=',
                'so.order_id'
            )
            ->whereNull('so.deleted_at')
            ->whereNull('pay.deleted_at')
            ->where('pay.status', 1)
            ->whereBetween('pay.paid_at', [
                $startDate,
                $endDate,
            ])
            ->select([
                'f.id',
                'f.name',
                'f.slug',
                'f.logo',
            ])
            ->selectRaw(
                'SUM(so.items_total) as items_revenue'
            )
            ->selectRaw(
                'SUM(so.shipping_fee) as shipping_revenue'
            )
            ->selectRaw(
                'SUM(so.total) as total_revenue'
            )
            ->selectRaw(
                'COUNT(DISTINCT so.id) as sub_order_count'
            )
            ->groupBy([
                'f.id',
                'f.name',
                'f.slug',
                'f.logo',
            ])
            ->orderByDesc('total_revenue')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'farm_id' => $item->id,
                    'farm_name' => $item->name,
                    'slug' => $item->slug,
                    'logo' => $item->logo,

                    'items_revenue' =>
                    (float) $item->items_revenue,

                    'shipping_revenue' =>
                    (float) $item->shipping_revenue,

                    'total_revenue' =>
                    (float) $item->total_revenue,

                    'sub_order_count' =>
                    (int) $item->sub_order_count,
                ];
            })
            ->values()
            ->all();
    }

    private function createEmptySeries(
        Carbon $startDate,
        Carbon $endDate,
        string $groupBy
    ): array {
        $series = [];

        $cursor = match ($groupBy) {
            'month' => $startDate->copy()->startOfMonth(),
            'year' => $startDate->copy()->startOfYear(),
            default => $startDate->copy()->startOfDay(),
        };

        $lastDate = match ($groupBy) {
            'month' => $endDate->copy()->startOfMonth(),
            'year' => $endDate->copy()->startOfYear(),
            default => $endDate->copy()->startOfDay(),
        };

        while ($cursor->lte($lastDate)) {
            $key = $this->periodKey(
                $cursor,
                $groupBy,
            );

            $series[$key] = [
                'key' => $key,

                'label' => $this->periodLabel(
                    $cursor,
                    $groupBy,
                ),

                'revenue' => 0,
                'paid_orders' => 0,
                'orders' => 0,
                'completed_orders' => 0,
                'cancelled_orders' => 0,
                'new_users' => 0,
            ];

            $cursor = match ($groupBy) {
                'month' => $cursor->copy()->addMonth(),
                'year' => $cursor->copy()->addYear(),
                default => $cursor->copy()->addDay(),
            };
        }

        return $series;
    }

    private function periodKey(
        Carbon $date,
        string $groupBy
    ): string {
        return match ($groupBy) {
            'month' => $date->format('Y-m'),
            'year' => $date->format('Y'),
            default => $date->format('Y-m-d'),
        };
    }

    private function periodLabel(
        Carbon $date,
        string $groupBy
    ): string {
        return match ($groupBy) {
            'month' => $date->format('m/Y'),
            'year' => $date->format('Y'),
            default => $date->format('d/m'),
        };
    }

    private function guessGroupBy(
        Carbon $startDate,
        Carbon $endDate
    ): string {
        $days = $startDate->diffInDays($endDate);

        if ($days <= 60) {
            return 'day';
        }

        if ($days <= 730) {
            return 'month';
        }

        return 'year';
    }
}
