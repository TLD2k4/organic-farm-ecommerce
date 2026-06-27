<?php

namespace Database\Seeders;

use App\Models\HarvestLot;
use App\Models\ProductCertificate;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class HarvestLotSeeder extends Seeder
{
    public function run(): void
    {
        $lotIndex = 1;

        for ($certificateId = 1; $certificateId <= 20; $certificateId++) {
            $certificate = ProductCertificate::find($certificateId);

            if (!$certificate) {
                continue;
            }

            for ($j = 1; $j <= 2; $j++) {
                $quantityImported = 100 + ($certificateId * 5);
                $quantitySold = 20 + ($j * 5);
                $quantityRemaining = $quantityImported - $quantitySold;

                // Lô hàng được tạo sau khi chứng nhận được duyệt
                $lotDate = Carbon::parse($certificate->approved_at)->addDays($j * 3);

                // Ngày thu hoạch trước lúc nhập lô 1 ngày
                $harvestDate = $lotDate->copy()->subDay();

                // Hạn sử dụng sau ngày thu hoạch 90 ngày
                $expiryDate = $harvestDate->copy()->addDays(90);

                HarvestLot::create([
                    'product_certificate_id' => $certificateId,
                    'lot_code' => 'LOT' . str_pad($lotIndex, 6, '0', STR_PAD_LEFT),

                    'harvest_date' => $harvestDate->toDateString(),
                    'expiry_date' => $expiryDate->toDateString(),

                    'quantity_imported' => $quantityImported,
                    'quantity_sold' => $quantitySold,
                    'quantity_remaining' => $quantityRemaining,

                    'status' => 1,
                    'note' => 'Lô hàng đạt tiêu chuẩn kiểm định và đủ điều kiện phân phối.',

                    'created_at' => $lotDate,
                    'updated_at' => $lotDate,
                ]);

                $lotIndex++;
            }
        }
    }
}