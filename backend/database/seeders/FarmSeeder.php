<?php

namespace Database\Seeders;

use App\Models\Farm;
use App\Models\User;
use Illuminate\Database\Seeder;

class FarmSeeder extends Seeder
{
    public function run(): void
    {
        $farms = [

            [
                'seller_id' => 2,
                'name' => 'Nông Trại Xanh Mekong',
                'slug' => 'nong-trai-xanh-mekong',
                'description' => 'Nông sản sạch đạt chuẩn VietGAP',
                'logo' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782464963/farm2_zxq2jt.png',
                'cover_image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782465301/cover_image_farm2_sbybwr.webp',
                'phone' => '0901000001',
                'address' => 'Tiền Giang',
                'status' => 1,
            ],

            [
                'seller_id' => 3,
                'name' => 'Trang Trại Hữu Cơ Cần Thơ',
                'slug' => 'trang-trai-huu-co-can-tho',
                'logo' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782464963/farm3_oggxy6.png',
                'cover_image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782465300/cover_image_farm1_j0ixct.jpg',
                'description' => 'Canh tác hữu cơ',
                'phone' => '0901000002',
                'address' => 'Cần Thơ',
                'status' => 1,
            ],

            [
                'seller_id' => 4,
                'name' => 'Vườn Rau Sạch An Phú',
                'slug' => 'vuon-rau-sach-an-phu',
                'logo' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782464964/farm4_skdupv.jpg',
                'description' => 'Rau sạch mỗi ngày',
                'phone' => '0901000003',
                'address' => 'An Giang',
                'status' => 1,
            ],

            [
                'seller_id' => 5,
                'name' => 'Organic Farm Đà Lạt',
                'slug' => 'organic-farm-da-lat',
                'logo' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782464964/farm5_d7kqak.jpg',
                'description' => 'Nông sản Đà Lạt',
                'phone' => '0901000004',
                'address' => 'Lâm Đồng',
                'status' => 1,
            ],

            [
                'seller_id' => 6,
                'name' => 'Nông Sản Thuận Thiên',
                'slug' => 'nong-san-thuan-thien',
                'logo' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782464963/farm1_lphwjq.jpg',
                'description' => 'Nông sản hữu cơ',
                'phone' => '0901000005',
                'address' => 'Long An',
                'status' => 1,
            ],
        ];

        foreach ($farms as $index => $farm) {
            $seller = User::find($farm['seller_id']);

            if (!$seller) {
                continue;
            }

            // Farm được tạo sau khi seller đăng ký vài ngày
            $farmDate = $seller->created_at->copy()->addDays(7 + $index);

            $farm['created_at'] = $farmDate;
            $farm['updated_at'] = $farmDate;

            Farm::create($farm);
        }
    }
}