<?php

namespace Database\Seeders;

use App\Models\HarvestLot;
use App\Models\Product;
use App\Models\ProductCertificate;
use Illuminate\Database\Seeder;
use RuntimeException;

class HarvestLotSeeder extends Seeder
{
    public function run(): void
    {
        $certificates = ProductCertificate::query()
            ->with('product')
            ->where('status', 1)
            ->whereDate('expiry_date', '>=', today())
            ->whereHas('product', function ($query) {
                $query
                    ->where('status', 1)
                    ->whereHas('farm', fn ($farmQuery) => $farmQuery->where('status', 1));
            })
            ->orderBy('id')
            ->take(20)
            ->get();

        if ($certificates->isEmpty()) {
            throw new RuntimeException(
                'Không thể seed lô hàng: không có sản phẩm với chứng chỉ hợp lệ.'
            );
        }

        $lotIndex = 1;

        foreach ($certificates as $certificateIndex => $certificate) {
            for ($lotNumber = 1; $lotNumber <= 2; $lotNumber++) {
                $quantityImported = 100 + (($certificateIndex + 1) * 5);
                $quantitySold = 20 + ($lotNumber * 5);
                $quantityRemaining = $quantityImported - $quantitySold;
                $dayOffset = ($certificateIndex + $lotNumber - 1) % 7;
                $harvestDate = today()->subDays($dayOffset);
                $expiryDate = $harvestDate->copy()->addDays(30);

                $lot = HarvestLot::withTrashed()->firstOrNew([
                    'lot_code' => 'LOT'
                        . str_pad((string) $lotIndex, 6, '0', STR_PAD_LEFT),
                ]);
                $lot->fill([
                    'product_certificate_id' => $certificate->id,
                    'harvest_date' => $harvestDate->toDateString(),
                    'expiry_date' => $expiryDate->toDateString(),
                    'quantity_imported' => $quantityImported,
                    'quantity_sold' => $quantitySold,
                    'quantity_remaining' => $quantityRemaining,
                    'status' => 1,
                    'note' => 'Lô hàng demo còn hạn và đủ điều kiện phân phối.',
                ]);
                $lot->deleted_at = null;
                $lot->save();

                $lotIndex++;
            }
        }

        $productIds = $certificates->pluck('product_id')->unique();

        foreach ($productIds as $productId) {
            $stock = HarvestLot::query()
                ->whereHas('productCertificate', function ($query) use ($productId) {
                    $query
                        ->where('product_id', $productId)
                        ->where('status', 1)
                        ->whereDate('expiry_date', '>=', today());
                })
                ->where('status', 1)
                ->whereDate('expiry_date', '>=', today())
                ->sum('quantity_remaining');

            Product::query()
                ->whereKey($productId)
                ->update(['stock_quantity' => $stock]);
        }
    }
}
