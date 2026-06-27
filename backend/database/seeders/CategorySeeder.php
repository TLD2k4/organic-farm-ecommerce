<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Category tạo trước product
        $categoryDate = now()->subDays(150);

        $rauLa = Category::create([
            'name' => 'Rau Lá',
            'slug' => 'rau-la',
            'image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/rau-muong-huu-co_kzlhwn.jpg',
            'status' => 1,
            'created_at' => $categoryDate,
            'updated_at' => $categoryDate,
        ]);

        $cuQua = Category::create([
            'name' => 'Củ, Quả',
            'slug' => 'cu-qua',
            'image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/ca-rot-da-lat_fty4u7.jpg',
            'status' => 1,
            'created_at' => $categoryDate->copy()->addMinutes(1),
            'updated_at' => $categoryDate->copy()->addMinutes(1),
        ]);

        $traiCay = Category::create([
            'name' => 'Trái Cây',
            'slug' => 'trai-cay',
            'image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411004/xoai-cat-hoa-loc_bxphnc.jpg',
            'status' => 1,
            'created_at' => $categoryDate->copy()->addMinutes(2),
            'updated_at' => $categoryDate->copy()->addMinutes(2),
        ]);

        $gaoNguCoc = Category::create([
            'name' => 'Gạo Và Ngũ Cốc',
            'slug' => 'gao-va-ngu-coc',
            'image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/gao-st25-soc-trang_r4dowq.webp',
            'status' => 1,
            'created_at' => $categoryDate->copy()->addMinutes(3),
            'updated_at' => $categoryDate->copy()->addMinutes(3),
        ]);

        $hatDinhDuong = Category::create([
            'name' => 'Hạt Dinh Dưỡng',
            'slug' => 'hat-dinh-duong',
            'image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/hat-dieu-rang-moc_xlne75.jpg',
            'status' => 1,
            'created_at' => $categoryDate->copy()->addMinutes(4),
            'updated_at' => $categoryDate->copy()->addMinutes(4),
        ]);

        $botTinhBot = Category::create([
            'name' => 'Bột Và Tinh Bột',
            'slug' => 'bot-va-tinh-bot',
            'image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/bot-gao-nguyen-chat_xpxhgp.jpg',
            'status' => 1,
            'created_at' => $categoryDate->copy()->addMinutes(5),
            'updated_at' => $categoryDate->copy()->addMinutes(5),
        ]);
            $children = [
                [$rauLa->id, 'Rau Muống', 'rau-muong', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/rau-muong-huu-co_kzlhwn.jpg'],
                [$rauLa->id, 'Cải Xanh', 'cai-xanh', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411001/cai-xanh-vietgap_gjbwc8.webp'],
                [$rauLa->id, 'Xà Lách', 'xa-lach', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411004/xa-lach-thuy-canh_o9uhvf.jpg'],
                [$rauLa->id, 'Rau Dền', 'rau-den', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/rau-den-sach_swtb66.jpg'],

                [$cuQua->id, 'Cà Rốt', 'ca-rot', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/ca-rot-da-lat_fty4u7.jpg'],
                [$cuQua->id, 'Khoai Lang', 'khoai-lang', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/khoai-lang-nhat_pclfoy.jpg'],
                [$cuQua->id, 'Bí Đỏ', 'bi-do', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411001/bi-do-ho-lo_uhnkfu.jpg'],
                [$cuQua->id, 'Dưa Leo', 'dua-leo', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/dua-leo-huu-co_ddw2ib.jpg'],

                [$traiCay->id, 'Xoài', 'xoai', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411004/xoai-cat-hoa-loc_bxphnc.jpg'],
                [$traiCay->id, 'Bưởi', 'buoi', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411001/buoi-da-xanh_p3f3xv.jpg'],
                [$traiCay->id, 'Cam', 'cam', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411001/cam-sanh-mien-tay_o3pvfr.jpg'],
                [$traiCay->id, 'Thanh Long', 'thanh-long', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411004/thanh-long-ruot-do_oyf4av.png'],

                [$gaoNguCoc->id, 'Gạo ST25', 'gao-st25', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/gao-st25-soc-trang_r4dowq.webp'],
                [$gaoNguCoc->id, 'Gạo Lứt', 'gao-lut', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/gao-lut-huu-co_dlmu9n.jpg'],
                [$gaoNguCoc->id, 'Yến Mạch', 'yen-mach', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411005/yen-mach-nguyen-hat_yvvvb0.webp'],
                [$gaoNguCoc->id, 'Bắp Mỹ', 'bap-my', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411001/bap-my-ngot_pgi8tb.jpg'],

                [$hatDinhDuong->id, 'Hạt Điều', 'hat-dieu', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/hat-dieu-rang-moc_xlne75.jpg'],
                [$hatDinhDuong->id, 'Hạnh Nhân', 'hanh-nhan', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/hanh-nhan-my_nytksg.jpg'],
                [$hatDinhDuong->id, 'Óc Chó', 'oc-cho', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/hat-dieu-rang-moc_xlne75.jpg'],
                [$hatDinhDuong->id, 'Macca', 'macca', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/hat-dieu-rang-moc_xlne75.jpg'],

                [$botTinhBot->id, 'Bột Gạo', 'bot-gao', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/bot-gao-nguyen-chat_xpxhgp.jpg'],
                [$botTinhBot->id, 'Bột Sắn', 'bot-san', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/bot-gao-nguyen-chat_xpxhgp.jpg'],
                [$botTinhBot->id, 'Tinh Bột Nghệ', 'tinh-bot-nghe', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411005/tinh-bot-nghe_bqiw4h.webp'],
                [$botTinhBot->id, 'Bột Yến Mạch', 'bot-yen-mach', 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411005/yen-mach-nguyen-hat_yvvvb0.webp'],
            ];

        foreach ($children as $index => $item) {
            $childDate = $categoryDate->copy()->addMinutes(10 + $index);

        Category::create([
            'parent_id' => $item[0],
            'name' => $item[1],
            'slug' => $item[2],
            'image' => $item[3],
            'status' => 1,
            'created_at' => $childDate,
            'updated_at' => $childDate,
        ]);
        }
    }
}