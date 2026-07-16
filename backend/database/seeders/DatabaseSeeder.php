<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            throw new RuntimeException(
                'DatabaseSeeder chứa dữ liệu demo. Không được chạy trong production.'
            );
        }

        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            SellerPolicySeeder::class,

            FarmSeeder::class,

            CategorySeeder::class,
            CertificationSeeder::class,

            ProductSeeder::class,
            ProductImageSeeder::class,
            ProductCertificateSeeder::class,
            HarvestLotSeeder::class,

            AddressSeeder::class,

            CartSeeder::class,
            CartItemSeeder::class,

            OrderSeeder::class,
            SubOrderSeeder::class,
            OrderItemSeeder::class,
            PaymentSeeder::class,
            ReviewSeeder::class,
            SystemTestScenarioSeeder::class,
        ]);
    }
}
