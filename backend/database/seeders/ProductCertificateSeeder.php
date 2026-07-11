<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductCertificate;
use Illuminate\Database\Seeder;

class ProductCertificateSeeder extends Seeder
{
    public function run(): void
    {
        for ($i = 1; $i <= 20; $i++) {
            $product = Product::find($i);

            if (!$product) {
                continue;
            }

            $certificateNumber = 'GCN-NS-' . str_pad($i, 5, '0', STR_PAD_LEFT);

            // Chứng nhận được duyệt sau khi sản phẩm được tạo 1 ngày
            $approvedAt = $product->created_at->copy()->addDay();

            // Ngày cấp chứng nhận trước ngày duyệt 1 tháng
            $issuedDate = $approvedAt->copy()->subMonth();

            // Hết hạn sau 1 năm kể từ ngày cấp
            $expiryDate = $issuedDate->copy()->addYear();

            ProductCertificate::create([
                'product_id' => $i,

                // 1 = VietGAP, 2 = GlobalGAP, 3 = Organic
                'certification_id' => (($i - 1) % 3) + 1,

                'certificate_number' => $certificateNumber,
                'certificate_file' => 'certificates/' . strtolower($certificateNumber) . '.pdf',

                'issued_date' => $issuedDate->toDateString(),
                'expiry_date' => $expiryDate->toDateString(),

                'status' => 1,

                // admin id = 1 duyệt
                'approved_by' => 1,
                'approved_at' => $approvedAt,

                'rejection_reason' => null,

                'created_at' => $approvedAt,
                'updated_at' => $approvedAt,
            ]);
        }
    }
}