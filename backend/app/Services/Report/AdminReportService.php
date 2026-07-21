<?php

namespace App\Services\Report;

use App\Models\Product;
use App\Services\Revenue\RevenueMetricsService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminReportService
{
    public function __construct(
        private RevenueMetricsService $revenueMetrics,
    ) {}

    public function getReport(array $filters): array
    {
        $startDate = !empty($filters['from_date'])
            ? Carbon::parse($filters['from_date'])->startOfDay()
            : now()->subDays(29)->startOfDay();

        $endDate = !empty($filters['to_date'])
            ? Carbon::parse($filters['to_date'])->endOfDay()
            : now()->endOfDay();

        $requestedGroupBy = $filters['group_by'] ?? 'auto';
        $groupBy = $requestedGroupBy === 'auto'
            ? $this->guessGroupBy($startDate, $endDate)
            : $this->capGroupByForRange(
                $requestedGroupBy,
                $startDate,
                $endDate
            );

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

            'top_stock_products' => $this->getTopStockProducts($limit),

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

        $totalSubOrders = DB::table('sub_orders as so')
            ->join('orders as o', 'o.id', '=', 'so.order_id')
            ->whereNull('so.deleted_at')
            ->whereNull('o.deleted_at')
            ->whereBetween('o.created_at', [$startDate, $endDate])
            ->count();

        $completedOrders = (clone $orderQuery)
            ->where('status', 3)
            ->count();

        $cancelledOrders = (clone $orderQuery)
            ->where('status', 4)
            ->count();

        $revenueTotals = $this->revenueMetrics->totals(
            null,
            $startDate,
            $endDate
        );

        $paidOrders = $revenueTotals['completed_sub_orders'];
        $revenue = $revenueTotals['total_revenue'];

        $newUsers = DB::table('users')
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [
                $startDate,
                $endDate,
            ])
            ->count();

        $revenueDateExpression = $this->revenueMetrics
            ->recognizedAtExpression('so');

        $totalItemsSold = (float) DB::table('order_items as oi')
            ->join(
                'sub_orders as so',
                'so.id',
                '=',
                'oi.sub_order_id'
            )
            ->whereNull('so.deleted_at')
            ->where('so.status', 3)
            ->where('so.payment_status', 1)
            ->whereBetween(DB::raw($revenueDateExpression), [
                $startDate,
                $endDate,
            ])
            ->sum('oi.quantity');

        return [
            'revenue' => $revenue,
            'items_revenue' => $revenueTotals['items_revenue'],
            'shipping_revenue' => $revenueTotals['shipping_revenue'],
            'completed_paid_sub_orders' => $revenueTotals['completed_sub_orders'],

            'total_orders' => $totalOrders,

            'total_sub_orders' => $totalSubOrders,

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
         * Doanh thu được ghi nhận theo ngày đơn con hoàn tất và đã thanh
         * toán. Số đơn ghi nhận được tính theo đơn con để khớp split order.
         */
        $recognizedAtExpression = $this->revenueMetrics
            ->recognizedAtExpression();

        $recognizedSubOrders = $this->revenueMetrics
            ->completedPaidSubOrders(null, $startDate, $endDate)
            ->select([
                'sub_orders.total',
            ])
            ->selectRaw("{$recognizedAtExpression} as recognized_at")
            ->get();

        foreach ($recognizedSubOrders as $subOrder) {
            $date = Carbon::parse($subOrder->recognized_at);
            $key = $this->periodKey($date, $groupBy);

            if (!isset($series[$key])) {
                continue;
            }

            $series[$key]['revenue'] += (float) $subOrder->total;
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

        $subOrders = DB::table('sub_orders as so')
            ->join('orders as o', 'o.id', '=', 'so.order_id')
            ->select([
                'so.created_at',
                'so.status',
            ])
            ->whereNull('so.deleted_at')
            ->whereNull('o.deleted_at')
            ->whereBetween('so.created_at', [$startDate, $endDate])
            ->get();

        foreach ($subOrders as $subOrder) {
            $key = $this->periodKey(Carbon::parse($subOrder->created_at), $groupBy);

            if (isset($series[$key])) {
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
        $revenueDateExpression = $this->revenueMetrics
            ->recognizedAtExpression('so');

        $validCertificates = DB::table('product_certificates')
            ->select('product_id')
            ->whereNull('deleted_at')
            ->where('status', 1)
            ->whereDate('expiry_date', '>=', today())
            ->groupBy('product_id');

        return DB::table('order_items as oi')
            ->leftJoin(
                'products as p',
                'p.id',
                '=',
                'oi.product_id'
            )
            ->leftJoin(
                'farms as f',
                'f.id',
                '=',
                'p.farm_id'
            )
            ->leftJoinSub(
                $validCertificates,
                'valid_certificates',
                'valid_certificates.product_id',
                '=',
                'p.id'
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
            ->whereNull('so.deleted_at')
            ->whereNull('o.deleted_at')
            ->where('so.status', 3)
            ->where('so.payment_status', 1)
            ->whereBetween(DB::raw($revenueDateExpression), [
                $startDate,
                $endDate,
            ])
            ->select([
                'oi.product_id',
                'oi.product_name',
                'oi.product_image',
                'oi.unit',
                'p.id as current_product_id',
                'p.slug as product_slug',
                'p.status as product_status',
                'p.deleted_at as product_deleted_at',
                'f.status as farm_status',
                'f.deleted_at as farm_deleted_at',
                'valid_certificates.product_id as valid_certificate_product_id',
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
                'p.id',
                'p.slug',
                'p.status',
                'p.deleted_at',
                'f.status',
                'f.deleted_at',
                'valid_certificates.product_id',
            ])
            ->orderByDesc('quantity_sold')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'product_image' => $item->product_image,
                    'product_slug' => $item->product_slug,
                    'current_product_exists' =>
                    $item->current_product_id !== null,
                    'is_publicly_visible' => $item->current_product_id !== null
                        && Product::query()
                            ->whereKey($item->current_product_id)
                            ->publiclyVisible()
                            ->exists(),
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

    /**
     * Xếp hạng tồn kho hiện tại, không phụ thuộc khoảng ngày của báo cáo.
     * Chỉ lấy sản phẩm đang bán, farm đang hoạt động và có chứng chỉ hợp lệ.
     */
    private function getTopStockProducts(int $limit): array
    {
        return Product::query()
            ->publiclyVisible()
            ->with('farm:id,name,slug')
            ->where('stock_quantity', '>', 0)
            ->orderByDesc('stock_quantity')
            ->orderBy('id')
            ->limit($limit)
            ->get()
            ->map(function (Product $product) {
                return [
                    'product_id' => (int) $product->id,
                    'product_name' => $product->name,
                    'product_slug' => $product->slug,
                    'product_image' => $product->thumbnail,
                    'stock_quantity' => (float) $product->stock_quantity,
                    'unit' => $product->unit,
                    'farm_id' => (int) $product->farm_id,
                    'farm_name' => $product->farm?->name,
                    'farm_slug' => $product->farm?->slug,
                    'current_product_exists' => true,
                    'is_publicly_visible' => true,
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
        $revenueDateExpression = $this->revenueMetrics
            ->recognizedAtExpression('so');

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
            ->whereNull('so.deleted_at')
            ->whereNull('o.deleted_at')
            ->where('so.status', 3)
            ->where('so.payment_status', 1)
            ->whereBetween(DB::raw($revenueDateExpression), [
                $startDate,
                $endDate,
            ])
            ->select([
                'c.id',
                'c.name',
                'c.slug',
                'c.image',
                'c.status',
                'c.deleted_at',
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
                'c.slug',
                'c.image',
                'c.status',
                'c.deleted_at',
            ])
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'category_id' => (int) $item->id,
                    'category_name' => $item->name,
                    'category_slug' => $item->slug,
                    'category_image' => $item->image,
                    'status' => (int) $item->status,
                    'deleted_at' => $item->deleted_at,

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
        $revenueDateExpression = $this->revenueMetrics
            ->recognizedAtExpression('so');

        return DB::table('sub_orders as so')
            ->join(
                'farms as f',
                'f.id',
                '=',
                'so.farm_id'
            )
            ->whereNull('so.deleted_at')
            ->where('so.status', 3)
            ->where('so.payment_status', 1)
            ->whereBetween(DB::raw($revenueDateExpression), [
                $startDate,
                $endDate,
            ])
            ->select([
                'f.id',
                'f.name',
                'f.slug',
                'f.logo',
                'f.status',
                'f.deleted_at',
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
                'f.status',
                'f.deleted_at',
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
                    'status' => (int) $item->status,
                    'deleted_at' => $item->deleted_at,

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
            'week' => $startDate->copy()->startOfWeek(Carbon::MONDAY),
            'month' => $startDate->copy()->startOfMonth(),
            'year' => $startDate->copy()->startOfYear(),
            default => $startDate->copy()->startOfDay(),
        };

        $lastDate = match ($groupBy) {
            'week' => $endDate->copy()->startOfWeek(Carbon::MONDAY),
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
                'sub_orders' => 0,
                'completed_orders' => 0,
                'cancelled_orders' => 0,
                'processing_sub_orders' => 0,
                'pending_sub_orders' => 0,
                'preparing_sub_orders' => 0,
                'shipping_sub_orders' => 0,
                'completed_sub_orders' => 0,
                'cancelled_sub_orders' => 0,
                'new_users' => 0,
            ];

            $cursor = match ($groupBy) {
                'week' => $cursor->copy()->addWeek(),
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
            'week' => $date->copy()
                ->startOfWeek(Carbon::MONDAY)
                ->format('Y-m-d'),
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
            'week' => 'Tuần ' . $date->format('d/m'),
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

        if ($days <= 31) {
            return 'day';
        }

        if ($days <= 180) {
            return 'week';
        }

        if ($days <= 730) {
            return 'month';
        }

        return 'year';
    }

    /**
     * Giữ số điểm trên biểu đồ ở mức dễ đọc, kể cả khi người dùng
     * chọn kiểu nhóm quá chi tiết cho một khoảng thời gian rất dài.
     */
    private function capGroupByForRange(
        string $groupBy,
        Carbon $startDate,
        Carbon $endDate
    ): string {
        $days = $startDate->diffInDays($endDate);

        if ($groupBy === 'day' && $days > 92) {
            return $days <= 365 ? 'week' : 'month';
        }

        if ($groupBy === 'week' && $days > 730) {
            return 'month';
        }

        if ($groupBy === 'month' && $days > 3650) {
            return 'year';
        }

        return $groupBy;
    }
}
