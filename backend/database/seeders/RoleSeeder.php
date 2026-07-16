<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach ([
            'admin' => 'Quản trị hệ thống',
            'seller' => 'Người bán',
            'customer' => 'Khách hàng',
        ] as $name => $description) {
            Role::updateOrCreate(
                ['name' => $name],
                [
                    'guard_name' => 'web',
                    'description' => $description,
                ]
            );
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
