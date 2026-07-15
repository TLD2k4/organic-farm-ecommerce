<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'farm_id' => 1,
                'category_id' => 7,
                'name' => 'Rau Muống Hữu Cơ',
                'slug' => 'rau-muong-huu-co',
                'description' => 'Rau muống được trồng theo quy trình hữu cơ, không sử dụng hóa chất độc hại.',
                'price' => 18000,
                'sale_price' => 15000,

                'unit' => 'kg',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/rau-muong-huu-co_kzlhwn.jpg',
                'is_hot' => 1,
                'status' => 1,
            ],
            [
                'farm_id' => 1,
                'category_id' => 8,
                'name' => 'Cải Xanh VietGAP',
                'slug' => 'cai-xanh-vietgap',
                'description' => 'Cải xanh tươi sạch đạt tiêu chuẩn VietGAP.',
                'price' => 25000,
                'sale_price' => 22000,

                'unit' => 'kg',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411001/cai-xanh-vietgap_gjbwc8.webp',
                'is_hot' => 1,
                'status' => 1,
            ],
            [
                'farm_id' => 1,
                'category_id' => 9,
                'name' => 'Xà Lách Thủy Canh',
                'slug' => 'xa-lach-thuy-canh',
                'description' => 'Xà lách thủy canh giòn ngọt, phù hợp ăn salad.',
                'price' => 32000,
                'sale_price' => 29000,

                'unit' => 'kg',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411004/xa-lach-thuy-canh_o9uhvf.jpg',
                'is_hot' => 0,
                'status' => 1,
            ],
            [
                'farm_id' => 1,
                'category_id' => 10,
                'name' => 'Rau Dền Sạch',
                'slug' => 'rau-den-sach',
                'description' => 'Rau dền đỏ tươi, được thu hoạch trong ngày.',
                'price' => 22000,
                'sale_price' => 20000,

                'unit' => 'kg',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/rau-den-sach_swtb66.jpg',
                'is_hot' => 0,
                'status' => 1,
            ],

            [
                'farm_id' => 2,
                'category_id' => 11,
                'name' => 'Cà Rốt Đà Lạt',
                'slug' => 'ca-rot-da-lat',
                'description' => 'Cà rốt Đà Lạt tươi ngon, vị ngọt tự nhiên.',
                'price' => 35000,
                'sale_price' => 30000,

                'unit' => 'kg',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/ca-rot-da-lat_fty4u7.jpg',
                'is_hot' => 1,
                'status' => 1,
            ],
            [
                'farm_id' => 2,
                'category_id' => 12,
                'name' => 'Khoai Lang Nhật',
                'slug' => 'khoai-lang-nhat',
                'description' => 'Khoai lang Nhật ruột vàng, dẻo ngọt.',
                'price' => 40000,
                'sale_price' => 35000,

                'unit' => 'kg',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/khoai-lang-nhat_pclfoy.jpg',
                'is_hot' => 1,
                'status' => 1,
            ],
            [
                'farm_id' => 2,
                'category_id' => 13,
                'name' => 'Bí Đỏ Hồ Lô',
                'slug' => 'bi-do-ho-lo',
                'description' => 'Bí đỏ hồ lô sạch, thích hợp nấu canh và làm sữa hạt.',
                'price' => 30000,
                'sale_price' => 27000,

                'unit' => 'kg',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411001/bi-do-ho-lo_uhnkfu.jpg',
                'is_hot' => 0,
                'status' => 1,
            ],
            [
                'farm_id' => 2,
                'category_id' => 14,
                'name' => 'Dưa Leo Hữu Cơ',
                'slug' => 'dua-leo-huu-co',
                'description' => 'Dưa leo hữu cơ giòn, mọng nước, không dư lượng thuốc bảo vệ thực vật.',
                'price' => 28000,
                'sale_price' => 25000,

                'unit' => 'kg',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/dua-leo-huu-co_ddw2ib.jpg',
                'is_hot' => 0,
                'status' => 1,
            ],

            [
                'farm_id' => 3,
                'category_id' => 15,
                'name' => 'Xoài Cát Hòa Lộc',
                'slug' => 'xoai-cat-hoa-loc',
                'description' => 'Xoài Cát Hòa Lộc đặc sản Tiền Giang, thịt vàng thơm ngọt.',
                'price' => 75000,
                'sale_price' => 68000,

                'unit' => 'kg',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411004/xoai-cat-hoa-loc_bxphnc.jpg',
                'is_hot' => 1,
                'status' => 1,
            ],
            [
                'farm_id' => 3,
                'category_id' => 16,
                'name' => 'Bưởi Da Xanh',
                'slug' => 'buoi-da-xanh',
                'description' => 'Bưởi da xanh ruột hồng, vị ngọt thanh, mọng nước.',
                'price' => 70000,
                'sale_price' => 65000,

                'unit' => 'kg',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411001/buoi-da-xanh_p3f3xv.jpg',
                'is_hot' => 1,
                'status' => 1,
            ],
            [
                'farm_id' => 3,
                'category_id' => 17,
                'name' => 'Cam Sành Miền Tây',
                'slug' => 'cam-sanh-mien-tay',
                'description' => 'Cam sành mọng nước, vị chua ngọt tự nhiên.',
                'price' => 45000,
                'sale_price' => 40000,

                'unit' => 'kg',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411001/cam-sanh-mien-tay_o3pvfr.jpg',
                'is_hot' => 0,
                'status' => 1,
            ],
            [
                'farm_id' => 3,
                'category_id' => 18,
                'name' => 'Thanh Long Ruột Đỏ',
                'slug' => 'thanh-long-ruot-do',
                'description' => 'Thanh long ruột đỏ tươi, giàu dinh dưỡng.',
                'price' => 50000,
                'sale_price' => 45000,

                'unit' => 'kg',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411004/thanh-long-ruot-do_oyf4av.png',
                'is_hot' => 0,
                'status' => 1,
            ],

            [
                'farm_id' => 4,
                'category_id' => 19,
                'name' => 'Gạo ST25 Sóc Trăng',
                'slug' => 'gao-st25-soc-trang',
                'description' => 'Gạo ST25 thơm dẻo, hạt dài, phù hợp bữa cơm gia đình.',
                'price' => 42000,
                'sale_price' => 39000,

                'unit' => 'kg',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/gao-st25-soc-trang_r4dowq.webp',
                'is_hot' => 1,
                'status' => 1,
            ],
            [
                'farm_id' => 4,
                'category_id' => 20,
                'name' => 'Gạo Lứt Hữu Cơ',
                'slug' => 'gao-lut-huu-co',
                'description' => 'Gạo lứt hữu cơ giàu chất xơ, phù hợp chế độ ăn lành mạnh.',
                'price' => 48000,
                'sale_price' => 45000,

                'unit' => 'kg',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/gao-lut-huu-co_dlmu9n.jpg',
                'is_hot' => 0,
                'status' => 1,
            ],
            [
                'farm_id' => 4,
                'category_id' => 21,
                'name' => 'Yến Mạch Nguyên Hạt',
                'slug' => 'yen-mach-nguyen-hat',
                'description' => 'Yến mạch nguyên hạt dùng cho bữa sáng, làm bánh hoặc pha sữa.',
                'price' => 65000,
                'sale_price' => 59000,

                'unit' => 'gói',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411005/yen-mach-nguyen-hat_yvvvb0.webp',
                'is_hot' => 0,
                'status' => 1,
            ],
            [
                'farm_id' => 4,
                'category_id' => 22,
                'name' => 'Bắp Mỹ Ngọt',
                'slug' => 'bap-my-ngot',
                'description' => 'Bắp Mỹ ngọt, hạt vàng đều, thích hợp luộc hoặc nấu súp.',
                'price' => 30000,
                'sale_price' => 27000,

                'unit' => 'kg',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411001/bap-my-ngot_pgi8tb.jpg',
                'is_hot' => 0,
                'status' => 1,
            ],

            [
                'farm_id' => 5,
                'category_id' => 23,
                'name' => 'Hạt Điều Rang Mộc',
                'slug' => 'hat-dieu-rang-moc',
                'description' => 'Hạt điều rang mộc, không tẩm gia vị, giữ vị béo tự nhiên.',
                'price' => 120000,
                'sale_price' => 110000,

                'unit' => 'hộp',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/hat-dieu-rang-moc_xlne75.jpg',
                'is_hot' => 1,
                'status' => 1,
            ],
            [
                'farm_id' => 5,
                'category_id' => 24,
                'name' => 'Hạnh Nhân Mỹ',
                'slug' => 'hanh-nhan-my',
                'description' => 'Hạnh nhân nhập khẩu, đóng gói sạch, phù hợp ăn vặt lành mạnh.',
                'price' => 220000,
                'sale_price' => 200000,

                'unit' => 'hộp',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/hanh-nhan-my_nytksg.jpg',
                'is_hot' => 0,
                'status' => 1,
            ],
            [
                'farm_id' => 5,
                'category_id' => 29,
                'name' => 'Tinh Bột Nghệ',
                'slug' => 'tinh-bot-nghe',
                'description' => 'Tinh bột nghệ nguyên chất, màu vàng tự nhiên, đóng gói an toàn.',
                'price' => 95000,
                'sale_price' => 85000,

                'unit' => 'hộp',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411005/tinh-bot-nghe_bqiw4h.webp',
                'is_hot' => 1,
                'status' => 1,
            ],
            [
                'farm_id' => 5,
                'category_id' => 27,
                'name' => 'Bột Gạo Nguyên Chất',
                'slug' => 'bot-gao-nguyen-chat',
                'description' => 'Bột gạo nguyên chất dùng làm bánh, nấu cháo hoặc chế biến món ăn.',
                'price' => 35000,
                'sale_price' => 32000,

                'unit' => 'gói',
                'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/bot-gao-nguyen-chat_xpxhgp.jpg',
                'is_hot' => 0,
                'status' => 1,
            ],
        ];
        $productBaseDate = now()->subDays(120);

        foreach ($products as $index => $product) {
            $productDate = $productBaseDate->copy()->addDays($index);

            $product['created_at'] = $productDate;
            $product['updated_at'] = $productDate;

            Product::create($product);
        }
    }
}
