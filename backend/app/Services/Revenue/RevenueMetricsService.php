<?php

namespace App\Services\Revenue;

use Carbon\CarbonInterface;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class RevenueMetricsService
{
    /**
     * Nguồn dữ liệu doanh thu chuẩn của toàn hệ thống.
     *
     * Chỉ ghi nhận đơn con đã hoàn tất và đã thanh toán. Dùng đơn con thay
     * vì payment/order cha để không cộng nhầm phần đã hủy trong đơn đa farm.
     */
    public function completedPaidSubOrders(
        ?int $farmId = null,
        ?CarbonInterface $from = null,
        ?CarbonInterface $to = null,
    ): Builder {
        $query = DB::table('sub_orders')
            ->whereNull('sub_orders.deleted_at')
            ->where('sub_orders.status', 3)
            ->where('sub_orders.payment_status', 1);

        if ($farmId !== null) {
            $query->where('sub_orders.farm_id', $farmId);
        }

        if ($from !== null && $to !== null) {
            $query->whereBetween(
                DB::raw($this->recognizedAtExpression()),
                [
                    $from->copy()->startOfDay(),
                    $to->copy()->endOfDay(),
                ]
            );
        }

        return $query;
    }

    public function totals(
        ?int $farmId = null,
        ?CarbonInterface $from = null,
        ?CarbonInterface $to = null,
    ): array {
        $row = $this->completedPaidSubOrders($farmId, $from, $to)
            ->selectRaw('COALESCE(SUM(sub_orders.items_total), 0) as items_revenue')
            ->selectRaw('COALESCE(SUM(sub_orders.shipping_fee), 0) as shipping_revenue')
            ->selectRaw('COALESCE(SUM(sub_orders.total), 0) as total_revenue')
            ->selectRaw('COUNT(sub_orders.id) as completed_sub_orders')
            ->selectRaw('COUNT(DISTINCT sub_orders.order_id) as completed_orders')
            ->first();

        return [
            'items_revenue' => (float) ($row->items_revenue ?? 0),
            'shipping_revenue' => (float) ($row->shipping_revenue ?? 0),
            'total_revenue' => (float) ($row->total_revenue ?? 0),
            'completed_sub_orders' => (int) ($row->completed_sub_orders ?? 0),
            'completed_orders' => (int) ($row->completed_orders ?? 0),
        ];
    }

    public function recognizedAtExpression(string $table = 'sub_orders'): string
    {
        return "COALESCE({$table}.completed_at, {$table}.updated_at)";
    }
}
