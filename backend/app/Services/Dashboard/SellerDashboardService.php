<?php

namespace App\Services\Dashboard;

use App\Models\Farm;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\HarvestLot;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SellerDashboardService
{
    public function getSellerDashboard(int $sellerId, array $filters = []): array
    {
        $farm = $this->getSellerFarm($sellerId);

        return [
            'farm' => [
                'id' => $farm->id,
                'name' => $farm->name,
            ],
            'today' => now()->format('d/m/Y'),

            'stats' => $this->getStats($farm),
            'revenue_chart' => $this->getRevenueChart($farm),
            'order_status' => $this->getOrderStatus($farm),
            'recent_orders' => $this->getRecentOrders($farm),
            'expiring_lots' => $this->getExpiringLots($farm),

            // Data cho dashboard nông trại
            'harvest_lots' => $this->getTopHarvestLots($farm),
            'low_stock_products' => $this->getLowStockProducts($farm),
            'warning_products' => $this->getWarningProducts($farm),
        ];
    }

    private function getSellerFarm(int $sellerId): Farm
    {
        $farm = Farm::where('seller_id', $sellerId)->first();

        if (!$farm) {
            abort(403, 'Tài khoản người bán chưa có gian hàng.');
        }

        return $farm;
    }

    private function getStats(Farm $farm): array
    {
        $totalProducts = Product::where('farm_id', $farm->id)->count();

        $newProducts = Product::where('farm_id', $farm->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $totalLots = HarvestLot::whereHas('productCertificate.product', function ($query) use ($farm) {
                $query->where('farm_id', $farm->id);
            })
            ->count();

        $newLots = HarvestLot::whereHas('productCertificate.product', function ($query) use ($farm) {
                $query->where('farm_id', $farm->id);
            })
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $totalStock = Product::where('farm_id', $farm->id)
            ->sum('stock_quantity');

        $availableLots = HarvestLot::whereHas('productCertificate.product', function ($query) use ($farm) {
                $query->where('farm_id', $farm->id);
            })
            ->where('status', 1)
            ->where('quantity_remaining', '>', 0)
            ->whereDate('expiry_date', '>=', today())
            ->count();

        $expiringLots = HarvestLot::whereHas('productCertificate', function ($query) use ($farm) {
                $query->where('status', 1)
                    ->whereDate('expiry_date', '>=', today())
                    ->whereHas('product', function ($productQuery) use ($farm) {
                        $productQuery->where('farm_id', $farm->id);
                    });
            })
            ->where('status', 1)
            ->where('quantity_remaining', '>', 0)
            ->whereBetween('expiry_date', [today(), today()->addDays(7)])
            ->count();

        $pendingOrders = DB::table('sub_orders')
            ->where('farm_id', $farm->id)
            ->where('status', 0)
            ->count();

        $newOrders = DB::table('sub_orders')
            ->where('farm_id', $farm->id)
            ->whereDate('created_at', today())
            ->count();

        $currentMonthFrom = now()->startOfMonth();
        $currentMonthTo = now()->endOfMonth();
        $previousMonthFrom = now()->subMonthNoOverflow()->startOfMonth();
        $previousMonthTo = $previousMonthFrom->copy()->endOfMonth();

        $monthRevenue = (float) ($this->baseRevenueQuery(
            $farm->id,
            $currentMonthFrom,
            $currentMonthTo
        )->selectRaw('COALESCE(SUM(order_items.quantity * order_items.price), 0) as total')->value('total') ?? 0);

        $lastMonthRevenue = (float) ($this->baseRevenueQuery(
            $farm->id,
            $previousMonthFrom,
            $previousMonthTo
        )->selectRaw('COALESCE(SUM(order_items.quantity * order_items.price), 0) as total')->value('total') ?? 0);

        $revenueGrowth = null;

        if ((float) $lastMonthRevenue > 0) {
            $revenueGrowth = round((($monthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1);
        } elseif ((float) $monthRevenue <= 0) {
            $revenueGrowth = 0;
        }

        return [
            'total_products' => $totalProducts,
            'new_products' => $newProducts,

            'total_lots' => $totalLots,
            'new_lots' => $newLots,
            'total_stock' => (float) $totalStock,
            'available_lots' => $availableLots,

            'pending_orders' => $pendingOrders,
            'new_orders' => $newOrders,

            'month_revenue' => (float) $monthRevenue,
            'month_revenue_text' => $this->formatMoney($monthRevenue),
            'revenue_growth' => $revenueGrowth,

            'expiring_lots' => $expiringLots,
        ];
    }

    private function getRevenueChart(Farm $farm): array
    {
        $from = today()->subDays(6)->startOfDay();
        $to = today()->endOfDay();
        $dateColumn = $this->getRevenueDateColumn();
        $rows = $this->baseRevenueQuery($farm->id, $from, $to)
            ->selectRaw("DATE({$dateColumn}) as revenue_date")
            ->selectRaw('COALESCE(SUM(order_items.quantity * order_items.price), 0) as revenue')
            ->groupBy(DB::raw("DATE({$dateColumn})"))
            ->orderBy('revenue_date')
            ->get()
            ->keyBy('revenue_date');
        $days = collect();

        for ($i = 6; $i >= 0; $i--) {
            $date = today()->subDays($i);
            $revenue = (float) ($rows->get($date->toDateString())?->revenue ?? 0);

            $days->push([
                'date' => $date->toDateString(),
                'label' => $date->format('d/m'),
                'revenue' => (float) $revenue,
            ]);
        }

        $maxRevenue = max($days->max('revenue'), 1);

        return $days->map(function ($item) use ($maxRevenue) {
            return [
                'date' => $item['date'],
                'label' => $item['label'],
                'revenue' => $item['revenue'],
                'revenue_text' => $this->formatShortMoney($item['revenue']),
                'percent' => $item['revenue'] > 0
                    ? round(($item['revenue'] / $maxRevenue) * 100)
                    : 5,
            ];
        })->values()->toArray();
    }

    private function baseRevenueQuery(int $farmId, Carbon $from, Carbon $to)
    {
        $dateColumn = $this->getRevenueDateColumn();

        $query = OrderItem::query()
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('sub_orders', 'sub_orders.id', '=', 'order_items.sub_order_id')
            ->join('orders', 'orders.id', '=', 'sub_orders.order_id')
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

    private function getOrderStatus(Farm $farm): array
    {
        $pending = DB::table('sub_orders')
            ->where('farm_id', $farm->id)
            ->where('status', 0)
            ->count();

        $shipping = DB::table('sub_orders')
            ->where('farm_id', $farm->id)
            ->where('status', 2)
            ->count();

        $processing = DB::table('sub_orders')
            ->where('farm_id', $farm->id)
            ->where('status', 1)
            ->count();

        $completed = DB::table('sub_orders')
            ->where('farm_id', $farm->id)
            ->where('status', 3)
            ->count();

        $cancelled = DB::table('sub_orders')
            ->where('farm_id', $farm->id)
            ->where('status', 4)
            ->count();

        return [
            'total' => $pending + $processing + $shipping + $completed + $cancelled,
            'pending' => $pending,
            'processing' => $processing,
            'shipping' => $shipping,
            'completed' => $completed,
            'cancelled' => $cancelled,
        ];
    }

    private function getRecentOrders(Farm $farm): array
    {
        return DB::table('sub_orders')
            ->leftJoin('orders', 'orders.id', '=', 'sub_orders.order_id')
            ->leftJoin('users', 'users.id', '=', 'orders.user_id')
            ->where('sub_orders.farm_id', $farm->id)
            ->orderByDesc('sub_orders.created_at')
            ->limit(5)
            ->select(
                'sub_orders.id',
                'sub_orders.sub_order_code',
                'sub_orders.created_at',
                'sub_orders.status',
                'sub_orders.total',
                'users.name as customer_name'
            )
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'code' => $order->sub_order_code,
                    'customer_name' => $order->customer_name ?? 'Khách hàng',
                    'total' => (float) $order->total,
                    'total_text' => $this->formatMoney($order->total),
                    'status' => (int) $order->status,
                    'status_text' => $this->getOrderStatusText((int) $order->status),
                    'status_class' => $this->getOrderStatusClass((int) $order->status),
                    'created_at' => Carbon::parse($order->created_at)->format('d/m/Y H:i'),
                ];
            })
            ->toArray();
    }

    private function getTopHarvestLots(Farm $farm): array
    {
        return HarvestLot::with([
                'productCertificate.certification',
                'productCertificate.product',
            ])
            ->whereHas('productCertificate.product', function ($query) use ($farm) {
                $query->where('farm_id', $farm->id);
            })
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(function ($lot) {
                $certificate = $lot->productCertificate;
                $product = $certificate?->product;

                $percentRemaining = 0;

                if ((float) $lot->quantity_imported > 0) {
                    $percentRemaining = round(
                        ((float) $lot->quantity_remaining / (float) $lot->quantity_imported) * 100
                    );
                }

                return [
                    'id' => $lot->id,
                    'lot_code' => $lot->lot_code,

                    'product_id' => $product?->id,
                    'product_name' => $product?->name,
                    'thumbnail' => $product?->thumbnail,

                    'certificate_name' => $certificate?->certification?->name,

                    'harvest_date' => optional($lot->harvest_date)->format('d/m/Y'),
                    'expiry_date' => optional($lot->expiry_date)->format('d/m/Y'),

                    'quantity_imported' => (float) $lot->quantity_imported,
                    'quantity_remaining' => (float) $lot->quantity_remaining,
                    'percent_remaining' => $percentRemaining,

                    'status' => (int) $lot->status,
                    'status_text' => $this->getLotStatusText($lot),
                    'status_class' => $this->getLotStatusClass($lot),
                ];
            })
            ->toArray();
    }

    private function getLowStockProducts(Farm $farm): array
    {
        return Product::where('farm_id', $farm->id)
            ->where('status', 1)
            ->where('stock_quantity', '<=', 20)
            ->orderBy('stock_quantity')
            ->limit(4)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'thumbnail' => $product->thumbnail,
                    'stock_quantity' => (float) $product->stock_quantity,
                    'unit' => $product->unit,
                ];
            })
            ->toArray();
    }

    private function getWarningProducts(Farm $farm): array
    {
        return Product::with(['approvedCertificate.certification', 'certificates.certification'])
            ->where('farm_id', $farm->id)
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(function ($product) {
                $approvedCertificate = $product->approvedCertificate;

                $latestCertificate = $product->certificates
                    ->sortByDesc('id')
                    ->first();

                $certificate = $latestCertificate ?: $approvedCertificate;

                $statusText = 'Chưa có chứng nhận';
                $statusClass = 'danger';

                if ($certificate) {
                    $status = (int) $certificate->status;

                    if ($status === 0) {
                        $statusText = 'Chờ duyệt';
                        $statusClass = 'pending';
                    } elseif ($status === 1) {
                        $statusText = 'Đã duyệt';
                        $statusClass = 'active';
                    } elseif ($status === 2) {
                        $statusText = 'Từ chối';
                        $statusClass = 'danger';
                    } elseif ($status === 3) {
                        $statusText = 'Hết hạn';
                        $statusClass = 'danger';
                    } elseif ($status === 4) {
                        $statusText = 'Thay thế';
                        $statusClass = 'pending';
                    }

                    if ($certificate->expiry_date && $certificate->expiry_date->lt(today())) {
                        $statusText = 'Hết hạn';
                        $statusClass = 'danger';
                    }
                }

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'thumbnail' => $product->thumbnail,
                    'stock_quantity' => (float) $product->stock_quantity,

                    'certificate_name' => $certificate?->certification?->name,
                    'certificate_number' => $certificate?->certificate_number,
                    'certificate_expiry_date' => optional($certificate?->expiry_date)->format('d/m/Y'),

                    'status_text' => $statusText,
                    'status_class' => $statusClass,
                ];
            })
            ->toArray();
    }

    private function getExpiringLots(Farm $farm): array
    {
        return HarvestLot::with([
                'productCertificate.certification',
                'productCertificate.product',
            ])
            ->whereHas('productCertificate', function ($query) use ($farm) {
                $query->where('status', 1)
                    ->whereDate('expiry_date', '>=', today())
                    ->whereHas('product', function ($productQuery) use ($farm) {
                        $productQuery->where('farm_id', $farm->id);
                    });
            })
            ->where('status', 1)
            ->where('quantity_remaining', '>', 0)
            ->whereBetween('expiry_date', [today(), today()->addDays(7)])
            ->orderBy('expiry_date')
            ->limit(5)
            ->get()
            ->map(function ($lot) {
                $certificate = $lot->productCertificate;
                $product = $certificate?->product;

                $daysLeft = today()->diffInDays($lot->expiry_date, false);

                return [
                    'id' => $lot->id,
                    'lot_code' => $lot->lot_code,
                    'product_name' => $product?->name,
                    'certificate_name' => $certificate?->certification?->name,
                    'expiry_date' => optional($lot->expiry_date)->format('d/m/Y'),
                    'days_left' => $daysLeft,
                    'days_left_text' => 'Còn ' . $daysLeft . ' ngày',
                ];
            })
            ->toArray();
    }

    private function getLotStatusText(HarvestLot $lot): string
    {
        if ((int) $lot->status === 2) {
            return 'Tạm ẩn';
        }

        if ((int) $lot->status === 3 || (float) $lot->quantity_remaining <= 0) {
            return 'Hết hàng';
        }

        if ((int) $lot->status === 4 || $lot->expiry_date->lt(today())) {
            return 'Hết hạn';
        }

        if ($lot->expiry_date->between(today(), today()->addDays(7))) {
            return 'Sắp hết hạn';
        }

        return 'Đang bán';
    }

    private function getLotStatusClass(HarvestLot $lot): string
    {
        if ((int) $lot->status === 2) {
            return 'pending';
        }

        if ((int) $lot->status === 3 || (float) $lot->quantity_remaining <= 0) {
            return 'danger';
        }

        if ((int) $lot->status === 4 || $lot->expiry_date->lt(today())) {
            return 'danger';
        }

        if ($lot->expiry_date->between(today(), today()->addDays(7))) {
            return 'warning';
        }

        return 'active';
    }

    private function formatMoney($amount): string
    {
        return number_format((float) $amount, 0, ',', '.') . ' đ';
    }

    private function formatShortMoney($amount): string
    {
        $amount = (float) $amount;

        if ($amount >= 1000000) {
            return round($amount / 1000000, 1) . 'M';
        }

        if ($amount >= 1000) {
            return round($amount / 1000) . 'K';
        }

        return $this->formatMoney($amount);
    }

    private function getOrderStatusText(int $status): string
    {
        return match ($status) {
            0 => 'Chờ xác nhận',
            1 => 'Đã xác nhận',
            2 => 'Đang giao',
            3 => 'Hoàn thành',
            4 => 'Đã hủy',
            default => 'Không xác định',
        };
    }

    private function getOrderStatusClass(int $status): string
    {
        return match ($status) {
            0, 1 => 'pending',
            2 => 'shipping',
            3 => 'completed',
            4 => 'cancelled',
            default => 'pending',
        };
    }
}
