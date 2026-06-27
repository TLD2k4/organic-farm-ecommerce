<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Role::create([
            'name' => 'admin',
            'guard_name' => 'web',
            'description' => 'Quản trị hệ thống'
        ]);

        Role::create([
            'name' => 'seller',
            'guard_name' => 'web',
            'description' => 'Người bán'
        ]);

        Role::create([
            'name' => 'customer',
            'guard_name' => 'web',
            'description' => 'Khách hàng'
        ]);
    }
}
