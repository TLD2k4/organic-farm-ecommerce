<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,

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
        ]);
    }
}