<?php

namespace Database\Seeders;

use App\Models\Certification;
use Illuminate\Database\Seeder;

class CertificationSeeder extends Seeder
{
    public function run(): void
    {
        // Certification là danh mục chuẩn, nên tạo từ rất sớm
        $certificationBaseDate = now()->subDays(160);

        $certifications = [
            [
                'name' => 'VietGAP',
                'description' => 'Tiêu chuẩn VietGAP',
                'status' => 1,
            ],
            [
                'name' => 'GlobalGAP',
                'description' => 'Tiêu chuẩn GlobalGAP',
                'status' => 1,
            ],
            [
                'name' => 'Organic',
                'description' => 'Chứng nhận hữu cơ',
                'status' => 1,
            ],
        ];

        foreach ($certifications as $index => $certification) {
            $certificationDate = $certificationBaseDate->copy()->addMinutes($index);

            $certification['created_at'] = $certificationDate;
            $certification['updated_at'] = $certificationDate;

            Certification::create($certification);
        }
    }
}