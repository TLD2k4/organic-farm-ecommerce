<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Seeder;

class AddressSeeder extends Seeder
{
    public function run(): void
    {
        $addresses = [
            [
                'address_line' => '12 Nguyễn Huệ',
                'ward' => 'Phường Bến Nghé',
                'district' => 'Quận 1',
                'province' => 'TP. Hồ Chí Minh',
            ],
            [
                'address_line' => '45 Lê Lợi',
                'ward' => 'Phường Bến Thành',
                'district' => 'Quận 1',
                'province' => 'TP. Hồ Chí Minh',
            ],
            [
                'address_line' => '89 Trần Hưng Đạo',
                'ward' => 'Phường An Cư',
                'district' => 'Ninh Kiều',
                'province' => 'Cần Thơ',
            ],
            [
                'address_line' => '23 Nguyễn Trãi',
                'ward' => 'Phường 2',
                'district' => 'Đà Lạt',
                'province' => 'Lâm Đồng',
            ],
            [
                'address_line' => '67 Hai Bà Trưng',
                'ward' => 'Phường 6',
                'district' => 'Mỹ Tho',
                'province' => 'Tiền Giang',
            ],
            [
                'address_line' => '105 Lý Thường Kiệt',
                'ward' => 'Phường 7',
                'district' => 'Tân Bình',
                'province' => 'TP. Hồ Chí Minh',
            ],
            [
                'address_line' => '31 Nguyễn Văn Linh',
                'ward' => 'Phường An Khánh',
                'district' => 'Ninh Kiều',
                'province' => 'Cần Thơ',
            ],
            [
                'address_line' => '18 Phan Chu Trinh',
                'ward' => 'Phường Hải Châu 1',
                'district' => 'Hải Châu',
                'province' => 'Đà Nẵng',
            ],
        ];

        for ($userId = 1; $userId <= 16; $userId++) {
            $user = User::find($userId);

            if (!$user) {
                continue;
            }

            $addressOne = $addresses[($userId - 1) % count($addresses)];
            $addressTwo = $addresses[$userId % count($addresses)];

            // Địa chỉ được tạo sau khi user đăng ký
            $addressOneDate = $user->created_at->copy()->addDays(1);
            $addressTwoDate = $user->created_at->copy()->addDays(2);

            Address::create([
                'user_id' => $userId,
                'receiver_name' => $user->name,
                'phone' => $user->phone,
                'address_line' => $addressOne['address_line'],
                'ward' => $addressOne['ward'],
                'district' => $addressOne['district'],
                'province' => $addressOne['province'],
                'is_default' => 1,
                'created_at' => $addressOneDate,
                'updated_at' => $addressOneDate,
            ]);

            Address::create([
                'user_id' => $userId,
                'receiver_name' => $user->name,
                'phone' => $user->phone,
                'address_line' => $addressTwo['address_line'],
                'ward' => $addressTwo['ward'],
                'district' => $addressTwo['district'],
                'province' => $addressTwo['province'],
                'is_default' => 0,
                'created_at' => $addressTwoDate,
                'updated_at' => $addressTwoDate,
            ]);
        }
    }
}