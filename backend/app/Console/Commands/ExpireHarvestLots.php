<?php

namespace App\Console\Commands;

use App\Models\HarvestLot;
use App\Models\Product;
use App\Models\ProductCertificate;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ExpireHarvestLots extends Command
{
    protected $signature = 'harvest-lots:expire {--date= : Ngày đối chiếu theo định dạng Y-m-d}';

    protected $description = 'Đánh dấu lô đã quá hạn sử dụng và đồng bộ lại tồn kho khả dụng của sản phẩm';

    public function handle(): int
    {
        try {
            $referenceDate = $this->option('date')
                ? Carbon::createFromFormat('Y-m-d', (string) $this->option('date'))->startOfDay()
                : today();
        } catch (\Throwable) {
            $this->error('Ngày đối chiếu không hợp lệ. Hãy dùng định dạng Y-m-d.');

            return self::FAILURE;
        }

        $expiredCount = 0;
        $affectedProductIds = collect();

        HarvestLot::query()
            ->whereIn('status', [1, 2])
            ->whereDate('expiry_date', '<', $referenceDate->toDateString())
            ->select(['id', 'product_certificate_id'])
            ->orderBy('id')
            ->chunkById(200, function ($lots) use (
                &$expiredCount,
                $affectedProductIds
            ): void {
                $lotIds = $lots->pluck('id')->all();
                $certificateIds = $lots
                    ->pluck('product_certificate_id')
                    ->filter()
                    ->unique()
                    ->values();

                $productIds = ProductCertificate::withTrashed()
                    ->whereIn('id', $certificateIds)
                    ->pluck('product_id')
                    ->filter()
                    ->unique()
                    ->values();

                DB::transaction(function () use ($lotIds, &$expiredCount): void {
                    $expiredCount += HarvestLot::query()
                        ->whereIn('id', $lotIds)
                        ->whereIn('status', [1, 2])
                        ->update(['status' => 4]);
                });

                $affectedProductIds->push(...$productIds);
            });

        $affectedProductIds = $affectedProductIds
            ->filter()
            ->unique()
            ->values();

        foreach ($affectedProductIds as $productId) {
            $this->syncProductStock((int) $productId, $referenceDate);
        }

        $this->info(
            "Đã chuyển {$expiredCount} lô sang Hết hạn và đồng bộ "
            . $affectedProductIds->count()
            . ' sản phẩm.'
        );

        return self::SUCCESS;
    }

    private function syncProductStock(
        int $productId,
        Carbon $referenceDate
    ): void {
        $stock = HarvestLot::query()
            ->whereHas('productCertificate', function ($query) use (
                $productId,
                $referenceDate
            ) {
                $query->where('product_id', $productId)
                    ->where('status', 1)
                    ->whereDate(
                        'expiry_date',
                        '>=',
                        $referenceDate->toDateString()
                    );
            })
            ->where('status', 1)
            ->where('quantity_remaining', '>', 0)
            ->whereDate(
                'expiry_date',
                '>=',
                $referenceDate->toDateString()
            )
            ->sum('quantity_remaining');

        Product::withoutGlobalScope('farm_not_deleted')
            ->withTrashed()
            ->whereKey($productId)
            ->update([
                'stock_quantity' => round((float) $stock, 2),
            ]);
    }
}
