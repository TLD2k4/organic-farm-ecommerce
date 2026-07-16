<?php

namespace App\Services\Dashboard;

use App\Models\Farm;
use App\Models\OrderItem;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class SellerRevenueService
{
    public function getReport(User $user, array $filters = []): array
    {
        $farm = $this->getSellerFarm($user);

        [$from, $to] = $this->resolveDateRange(
            $filters['period'] ?? '30d',
            $filters['from'] ?? null,
            $filters['to'] ?? null
        );

        $limit = min(20, max(1, (int) ($filters['limit'] ?? 10)));
        $chartGroup = $this->resolveChartGroup($from, $to);

        $currentSummary = $this->getSummary($farm->id, $from, $to);

        [$previousFrom, $previousTo] = $this->resolvePreviousRange($from, $to);

        $previousSummary = $this->getSummary($farm->id, $previousFrom, $previousTo);

        return [
            'farm' => [
                'id' => $farm->id,
                'name' => $farm->name,
            ],

            'filters' => [
                'period' => $filters['period'] ?? '30d',
                'from' => $from->format('Y-m-d'),
                'to' => $to->format('Y-m-d'),
                'previous_from' => $previousFrom->format('Y-m-d'),
                'previous_to' => $previousTo->format('Y-m-d'),
                'group_by' => $chartGroup,
            ],

            'summary' => [
                ...$currentSummary,
                'comparison' => [
                    'revenue_percent' => $this->percentChange(
                        $currentSummary['total_revenue'],
                        $previousSummary['total_revenue']
                    ),
                    'orders_percent' => $this->percentChange(
                        $currentSummary['completed_orders'],
                        $previousSummary['completed_orders']
                    ),
                    'sold_percent' => $this->percentChange(
                        $currentSummary['sold_quantity'],
                        $previousSummary['sold_quantity']
                    ),
                    'avg_order_percent' => $this->percentChange(
                        $currentSummary['avg_order_value'],
                        $previousSummary['avg_order_value']
                    ),
                ],
            ],

            'revenue_chart' => $this->getRevenueChart(
                $farm->id,
                $from,
                $to,
                $chartGroup
            ),

            'top_products' => $this->getTopProducts(
                $farm->id,
                $from,
                $to,
                $limit,
                $currentSummary['total_revenue']
            ),
        ];
    }

    private function getSellerFarm(User $user): Farm
    {
        $farm = Farm::query()
            ->where('seller_id', $user->id)
            ->first();

        if (!$farm) {
            throw ValidationException::withMessages([
                'farm' => ['Bạn chưa có gian hàng hoặc không có quyền seller.'],
            ]);
        }

        return $farm;
    }

    private function getSummary(int $farmId, Carbon $from, Carbon $to): array
    {
        $baseQuery = $this->baseRevenueQuery($farmId, $from, $to);

        $totalRevenue = (float) ((clone $baseQuery)
            ->selectRaw('COALESCE(SUM(order_items.quantity * order_items.price), 0) as total')
            ->value('total') ?? 0);

        $completedOrders = (int) (clone $baseQuery)
            ->distinct('sub_orders.id')
            ->count('sub_orders.id');

        $soldQuantity = (float) ((clone $baseQuery)
            ->selectRaw('COALESCE(SUM(order_items.quantity), 0) as total')
            ->value('total') ?? 0);

        $avgOrderValue = $completedOrders > 0
            ? round($totalRevenue / $completedOrders, 2)
            : 0;

        return [
            'total_revenue' => $totalRevenue,
            'completed_orders' => $completedOrders,
            'sold_quantity' => $soldQuantity,
            'avg_order_value' => $avgOrderValue,
        ];
    }

    private function baseRevenueQuery(int $farmId, Carbon $from, Carbon $to)
    {
        $dateColumn = $this->getRevenueDateColumn();

        $query = OrderItem::query()
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('sub_orders', 'sub_orders.id', '=', 'order_items.sub_order_id')
            ->join('orders', 'orders.id', '=', 'sub_orders.order_id')
            // Dùng farm được chốt trên đơn con để số liệu lịch sử không mất
            // khi sản phẩm bị ẩn, xóa hoặc thay đổi thông tin sau khi bán.
            ->where('sub_orders.farm_id', $farmId)
            ->where('sub_orders.status', 3)
            ->whereBetween($dateColumn, [
                $from->copy()->startOfDay(),
                $to->copy()->endOfDay(),
            ]);

        if (Schema::hasColumn('sub_orders', 'payment_status')) {
            $query->whereIn('sub_orders.payment_status', [0, 1]);
        }

        return $query;
    }

    private function getRevenueChart(
        int $farmId,
        Carbon $from,
        Carbon $to,
        string $groupBy
    )
    {
        $dateColumn = $this->getRevenueDateColumn();
        $dateSelect = match ($groupBy) {
            'month' => "DATE_FORMAT({$dateColumn}, '%Y-%m-01')",
            'week' => "DATE_SUB(DATE({$dateColumn}), INTERVAL WEEKDAY({$dateColumn}) DAY)",
            default => "DATE({$dateColumn})",
        };

        $rows = $this->baseRevenueQuery($farmId, $from, $to)
            ->selectRaw("{$dateSelect} as period_date")
            ->selectRaw('COALESCE(SUM(order_items.quantity * order_items.price), 0) as revenue')
            ->selectRaw('COUNT(DISTINCT sub_orders.id) as order_count')
            ->selectRaw('COALESCE(SUM(order_items.quantity), 0) as sold_quantity')
            ->groupBy(DB::raw($dateSelect))
            ->orderBy('period_date')
            ->get()
            ->keyBy('period_date');

        $result = collect();

        if ($groupBy === 'month') {
            $cursor = $from->copy()->startOfMonth();
            $end = $to->copy()->startOfMonth();

            while ($cursor->lte($end)) {
                $key = $cursor->format('Y-m-01');
                $row = $rows->get($key);

                $result->push([
                    'date' => $cursor->format('m/Y'),
                    'raw_date' => $key,
                    'revenue' => (float) ($row?->revenue ?? 0),
                    'order_count' => (int) ($row?->order_count ?? 0),
                    'sold_quantity' => (float) ($row?->sold_quantity ?? 0),
                ]);

                $cursor->addMonth();
            }

            return $result->values();
        }

        if ($groupBy === 'week') {
            $cursor = $from->copy()->startOfWeek(Carbon::MONDAY);
            $end = $to->copy()->startOfWeek(Carbon::MONDAY);

            while ($cursor->lte($end)) {
                $key = $cursor->format('Y-m-d');
                $row = $rows->get($key);
                $weekEnd = $cursor->copy()->endOfWeek(Carbon::SUNDAY);

                if ($weekEnd->gt($to)) {
                    $weekEnd = $to->copy();
                }

                $result->push([
                    'date' => $cursor->format('d/m')
                        . '–' . $weekEnd->format('d/m'),
                    'raw_date' => $key,
                    'revenue' => (float) ($row?->revenue ?? 0),
                    'order_count' => (int) ($row?->order_count ?? 0),
                    'sold_quantity' => (float) ($row?->sold_quantity ?? 0),
                ]);

                $cursor->addWeek();
            }

            return $result->values();
        }

        foreach (CarbonPeriod::create($from, $to) as $date) {
            $key = $date->format('Y-m-d');
            $row = $rows->get($key);

            $result->push([
                'date' => $date->format('d/m'),
                'raw_date' => $key,
                'revenue' => (float) ($row?->revenue ?? 0),
                'order_count' => (int) ($row?->order_count ?? 0),
                'sold_quantity' => (float) ($row?->sold_quantity ?? 0),
            ]);
        }

        return $result->values();
    }

    private function resolveChartGroup(Carbon $from, Carbon $to): string
    {
        $days = $from->diffInDays($to) + 1;

        if ($days <= 31) {
            return 'day';
        }

        if ($days <= 180) {
            return 'week';
        }

        return 'month';
    }

    private function getTopProducts(
        int $farmId,
        Carbon $from,
        Carbon $to,
        int $limit,
        float $totalRevenue
    ) {
        return $this->baseRevenueQuery($farmId, $from, $to)
            ->select([
                'products.id',
                'products.name',
                'products.thumbnail',
                'products.unit',
            ])
            ->selectRaw('COALESCE(SUM(order_items.quantity), 0) as sold_quantity')
            ->selectRaw('COALESCE(SUM(order_items.quantity * order_items.price), 0) as revenue')
            ->selectRaw('COUNT(DISTINCT sub_orders.id) as order_count')
            ->groupBy(
                'products.id',
                'products.name',
                'products.thumbnail',
                'products.unit'
            )
            ->orderByDesc('revenue')
            ->orderByDesc('sold_quantity')
            ->limit($limit)
            ->get()
            ->map(function ($product) use ($totalRevenue) {
                $revenue = (float) $product->revenue;

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'thumbnail' => $product->thumbnail,
                    'thumbnail_url' => $product->thumbnail,
                    'unit' => $product->unit,
                    'sold_quantity' => (float) $product->sold_quantity,
                    'revenue' => $revenue,
                    'order_count' => (int) $product->order_count,
                    'revenue_share' => $totalRevenue > 0
                        ? round(($revenue / $totalRevenue) * 100, 1)
                        : 0,
                ];
            })
            ->values();
    }

    private function getRevenueDateColumn(): string
    {
        if (Schema::hasColumn('sub_orders', 'completed_at')) {
            return 'sub_orders.completed_at';
        }

        if (Schema::hasColumn('sub_orders', 'delivered_at')) {
            return 'sub_orders.delivered_at';
        }

        return 'sub_orders.updated_at';
    }

    private function resolvePreviousRange(Carbon $from, Carbon $to): array
    {
        $days = $from->diffInDays($to) + 1;

        $previousTo = $from->copy()->subDay()->endOfDay();
        $previousFrom = $previousTo->copy()->subDays($days - 1)->startOfDay();

        return [$previousFrom, $previousTo];
    }

    private function percentChange(float|int $current, float|int $previous): ?float
    {
        $current = (float) $current;
        $previous = (float) $previous;

        if ($previous <= 0) {
            return $current > 0 ? null : 0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    private function resolveDateRange(string $period, ?string $from, ?string $to): array
    {
        $now = now();

        return match ($period) {
            'today' => [
                $now->copy()->startOfDay(),
                $now->copy()->endOfDay(),
            ],

            '7d' => [
                $now->copy()->subDays(6)->startOfDay(),
                $now->copy()->endOfDay(),
            ],

            'month' => [
                $now->copy()->startOfMonth(),
                $now->copy()->endOfDay(),
            ],

            'year' => [
                $now->copy()->startOfYear(),
                $now->copy()->endOfDay(),
            ],

            'custom' => [
                $from
                    ? Carbon::parse($from)->startOfDay()
                    : $now->copy()->subDays(29)->startOfDay(),

                $to
                    ? Carbon::parse($to)->endOfDay()
                    : $now->copy()->endOfDay(),
            ],

            default => [
                $now->copy()->subDays(29)->startOfDay(),
                $now->copy()->endOfDay(),
            ],
        };
    }
}
