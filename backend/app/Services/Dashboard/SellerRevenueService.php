<?php

namespace App\Services\Dashboard;

use App\Models\Farm;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\Revenue\RevenueMetricsService;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SellerRevenueService
{
    public function __construct(
        private RevenueMetricsService $revenueMetrics,
    ) {}

    public function getReport(User $user, array $filters = []): array
    {
        $farm = $this->getSellerFarm($user);

        [$from, $to] = $this->resolveDateRange(
            $filters['period'] ?? 'month',
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
                'period' => $filters['period'] ?? 'month',
                'from' => $from->format('Y-m-d'),
                'to' => $to->format('Y-m-d'),
                'previous_from' => $previousFrom->format('Y-m-d'),
                'previous_to' => $previousTo->format('Y-m-d'),
                'group_by' => $chartGroup,
                'limit' => $limit,
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
                $currentSummary['items_revenue']
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
        $revenueTotals = $this->revenueMetrics->totals(
            $farmId,
            $from,
            $to
        );

        $soldQuantity = (float) ($this->baseSoldItemsQuery(
            $farmId,
            $from,
            $to
        )
            ->selectRaw('COALESCE(SUM(order_items.quantity), 0) as total')
            ->value('total') ?? 0);

        $completedOrders = $revenueTotals['completed_sub_orders'];
        $totalRevenue = $revenueTotals['total_revenue'];

        return [
            'total_revenue' => $totalRevenue,
            'items_revenue' => $revenueTotals['items_revenue'],
            'shipping_revenue' => $revenueTotals['shipping_revenue'],
            'completed_orders' => $completedOrders,
            'sold_quantity' => $soldQuantity,
            'avg_order_value' => $completedOrders > 0
                ? round($totalRevenue / $completedOrders, 2)
                : 0,
        ];
    }

    private function baseSoldItemsQuery(int $farmId, Carbon $from, Carbon $to)
    {
        $dateExpression = $this->revenueMetrics
            ->recognizedAtExpression();

        return OrderItem::query()
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('sub_orders', 'sub_orders.id', '=', 'order_items.sub_order_id')
            ->whereNull('sub_orders.deleted_at')
            ->where('sub_orders.farm_id', $farmId)
            ->where('sub_orders.status', 3)
            ->where('sub_orders.payment_status', 1)
            ->whereBetween(DB::raw($dateExpression), [
                $from->copy()->startOfDay(),
                $to->copy()->endOfDay(),
            ]);
    }

    private function getRevenueChart(
        int $farmId,
        Carbon $from,
        Carbon $to,
        string $groupBy
    ) {
        $dateExpression = $this->revenueMetrics
            ->recognizedAtExpression();

        $dateSelect = match ($groupBy) {
            'month' => "DATE_FORMAT({$dateExpression}, '%Y-%m-01')",
            'week' => "DATE_SUB(DATE({$dateExpression}), INTERVAL WEEKDAY({$dateExpression}) DAY)",
            default => "DATE({$dateExpression})",
        };

        $revenueRows = $this->revenueMetrics
            ->completedPaidSubOrders($farmId, $from, $to)
            ->selectRaw("{$dateSelect} as period_date")
            ->selectRaw('COALESCE(SUM(sub_orders.total), 0) as revenue')
            ->selectRaw('COUNT(sub_orders.id) as order_count')
            ->groupBy(DB::raw($dateSelect))
            ->orderBy('period_date')
            ->get()
            ->keyBy('period_date');

        $soldRows = $this->baseSoldItemsQuery($farmId, $from, $to)
            ->selectRaw("{$dateSelect} as period_date")
            ->selectRaw('COALESCE(SUM(order_items.quantity), 0) as sold_quantity')
            ->groupBy(DB::raw($dateSelect))
            ->get()
            ->keyBy('period_date');

        $result = collect();

        $pushPeriod = function (Carbon $cursor, string $key, string $label) use (
            $result,
            $revenueRows,
            $soldRows
        ): void {
            $revenueRow = $revenueRows->get($key);
            $soldRow = $soldRows->get($key);

            $result->push([
                'date' => $label,
                'raw_date' => $key,
                'revenue' => (float) ($revenueRow?->revenue ?? 0),
                'order_count' => (int) ($revenueRow?->order_count ?? 0),
                'sold_quantity' => (float) ($soldRow?->sold_quantity ?? 0),
            ]);
        };

        if ($groupBy === 'month') {
            $cursor = $from->copy()->startOfMonth();
            $end = $to->copy()->startOfMonth();

            while ($cursor->lte($end)) {
                $key = $cursor->format('Y-m-01');
                $pushPeriod($cursor, $key, $cursor->format('m/Y'));
                $cursor->addMonth();
            }

            return $result->values();
        }

        if ($groupBy === 'week') {
            $cursor = $from->copy()->startOfWeek(Carbon::MONDAY);
            $end = $to->copy()->startOfWeek(Carbon::MONDAY);

            while ($cursor->lte($end)) {
                $key = $cursor->format('Y-m-d');
                $weekEnd = $cursor->copy()->endOfWeek(Carbon::SUNDAY);

                if ($weekEnd->gt($to)) {
                    $weekEnd = $to->copy();
                }

                $pushPeriod(
                    $cursor,
                    $key,
                    $cursor->format('d/m') . '–' . $weekEnd->format('d/m')
                );
                $cursor->addWeek();
            }

            return $result->values();
        }

        foreach (CarbonPeriod::create($from, $to) as $date) {
            $key = $date->format('Y-m-d');
            $pushPeriod($date, $key, $date->format('d/m'));
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
        return $this->baseSoldItemsQuery($farmId, $from, $to)
            ->select([
                'products.id',
                'products.name',
                'products.slug',
                'products.thumbnail',
                'products.unit',
            ])
            ->selectRaw('COALESCE(SUM(order_items.quantity), 0) as sold_quantity')
            ->selectRaw('COALESCE(SUM(order_items.subtotal), 0) as revenue')
            ->selectRaw('COUNT(DISTINCT sub_orders.id) as order_count')
            ->groupBy(
                'products.id',
                'products.name',
                'products.slug',
                'products.thumbnail',
                'products.unit'
            )
            ->orderByDesc('sold_quantity')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->map(function ($product) use ($totalRevenue) {
                $revenue = (float) $product->revenue;
                $productModel = Product::with(['approvedCertificate', 'farm'])
                    ->find($product->id);
                $isPubliclyVisible = $productModel?->isPubliclyVisible() ?? false;

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'is_publicly_visible' => (bool) $isPubliclyVisible,
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
