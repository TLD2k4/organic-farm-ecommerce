<?php

namespace Database\Seeders;

use App\Models\Certification;
use App\Models\Product;
use App\Models\ProductCertificate;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class ProductCertificateSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::role('admin')->orderBy('id')->first();
        $certificationIds = Certification::query()
            ->where('status', 1)
            ->orderBy('id')
            ->pluck('id')
            ->values();

        if (!$admin || $certificationIds->isEmpty()) {
            throw new RuntimeException(
                'Không thể seed chứng chỉ: thiếu admin hoặc loại chứng chỉ đang hoạt động.'
            );
        }

        $products = Product::query()
            ->where('status', 1)
            ->whereHas('farm', fn ($query) => $query->where('status', 1))
            ->orderBy('id')
            ->take(20)
            ->get();

        foreach ($products as $index => $product) {
            $certificateNumber = 'GCN-NS-'
                . str_pad((string) $product->id, 6, '0', STR_PAD_LEFT);
            $dayOffset = $index === 0 ? 0 : (($index * 3) % 30);
            $issuedDate = today()->subDays($dayOffset);
            $approvedAt = $issuedDate->copy()->setTime(8, 0)->addMinutes($index);
            if ($approvedAt->isFuture()) {
                $approvedAt = now();
            }
            $expiryDate = $issuedDate->copy()->addYear();

            $certificate = ProductCertificate::withTrashed()->firstOrNew([
                'certificate_number' => $certificateNumber,
            ]);

            $certificate->fill([
                'product_id' => $product->id,
                'certification_id' => $certificationIds[
                    $index % $certificationIds->count()
                ],
                'certificate_file' => 'certificates/'
                    . strtolower($certificateNumber)
                    . '.pdf',
                'issued_date' => $issuedDate->toDateString(),
                'expiry_date' => $expiryDate->toDateString(),
                'status' => 1,
                'approved_by' => $admin->id,
                'approved_at' => $approvedAt,
                'rejection_reason' => null,
            ]);
            $certificate->deleted_at = null;
            $certificate->save();
        }
    }
}
