<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $userBaseDate = now()->subDays(220);

        $users = [

            [
                'name' => 'Nguyễn Minh Khôi',
                'email' => 'admin@organicfarm.vn',
                'phone' => '0901234567',
                'password' => '12345678',
                'status' => 1,
                'role' => 'admin'
            ],

            [
                'name' => 'Trần Quốc Huy',
                'email' => 'tranquochuy@gmail.com',
                'phone' => '0911111111',
                'password' => '12345678',
                'status' => 1,
                'role' => 'seller'
            ],

            [
                'name' => 'Lê Hoàng Nam',
                'email' => 'lehoangnam@gmail.com',
                'phone' => '0911111112',
                'password' => '12345678',
                'status' => 1,
                'role' => 'seller'
            ],

            [
                'name' => 'Phạm Gia Bảo',
                'email' => 'phamgiabao@gmail.com',
                'phone' => '0911111113',
                'password' => '12345678',
                'status' => 1,
                'role' => 'seller'
            ],

            [
                'name' => 'Nguyễn Thị Lan Anh',
                'email' => 'nguyenthilananh@gmail.com',
                'phone' => '0911111114',
                'password' => '12345678',
                'status' => 1,
                'role' => 'seller'
            ],

            [
                'name' => 'Võ Thanh Tùng',
                'email' => 'vothanhtung@gmail.com',
                'phone' => '0911111115',
                'password' => '12345678',
                'status' => 1,
                'role' => 'seller'
            ],

            [
                'name' => 'Nguyễn Văn Đức',
                'email' => 'nguyenvanduc@gmail.com',
                'phone' => '0921111111',
                'password' => '12345678',
                'status' => 1,
                'role' => 'customer'
            ],

            [
                'name' => 'Trần Thị Mai',
                'email' => 'tranthimai@gmail.com',
                'phone' => '0921111112',
                'password' => '12345678',
                'status' => 1,
                'role' => 'customer'
            ],

            [
                'name' => 'Lê Khánh Linh',
                'email' => 'lekhanhlinh@gmail.com',
                'phone' => '0921111113',
                'password' => '12345678',
                'status' => 1,
                'role' => 'customer'
            ],

            [
                'name' => 'Phạm Minh Tuấn',
                'email' => 'phamminhtuan@gmail.com',
                'phone' => '0921111114',
                'password' => '12345678',
                'status' => 1,
                'role' => 'customer'
            ],

            [
                'name' => 'Hoàng Ngọc Anh',
                'email' => 'hoangngocanh@gmail.com',
                'phone' => '0921111115',
                'password' => '12345678',
                'status' => 1,
                'role' => 'customer'
            ],

            [
                'name' => 'Nguyễn Nhật Quang',
                'email' => 'nguyennhatquang@gmail.com',
                'phone' => '0921111116',
                'password' => '12345678',
                'status' => 1,
                'role' => 'customer'
            ],

            [
                'name' => 'Vũ Thảo Vy',
                'email' => 'vuthaovy@gmail.com',
                'phone' => '0921111117',
                'password' => '12345678',
                'status' => 1,
                'role' => 'customer'
            ],

            [
                'name' => 'Đặng Gia Hân',
                'email' => 'danggiahan@gmail.com',
                'phone' => '0921111118',
                'password' => '12345678',
                'status' => 1,
                'role' => 'customer'
            ],

            [
                'name' => 'Ngô Quốc Việt',
                'email' => 'ngoquocviet@gmail.com',
                'phone' => '0921111119',
                'password' => '12345678',
                'status' => 1,
                'role' => 'customer'
            ],

            [
                'name' => 'Trần Thanh Hà',
                'email' => 'tranthanhha@gmail.com',
                'phone' => '0921111120',
                'password' => '12345678',
                'status' => 1,
                'role' => 'customer'
            ]
        ];

        foreach ($users as $index => $item) {
            $role = $item['role'];
            unset($item['role']);

            $userDate = $userBaseDate->copy()->addDays($index);

            $item['created_at'] = $userDate;
            $item['updated_at'] = $userDate;

            $user = User::create($item);

            $user->assignRole($role);
        }
    }
}