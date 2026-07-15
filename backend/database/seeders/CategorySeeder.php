<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Category tạo trước Product.
        $categoryDate = now()->subDays(150);

        // =====================================================
        // DANH MỤC CHA
        // =====================================================

        $rauLa = Category::create([
            'parent_id' => null,
            'name' => 'Rau Lá',
            'slug' => 'rau-la',
            'description' => 'Các loại rau lá tươi sạch, giàu vitamin, chất xơ và được canh tác theo quy trình an toàn.',
            'image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/rau-muong-huu-co_kzlhwn.jpg',
            'status' => 1,
            'created_at' => $categoryDate,
            'updated_at' => $categoryDate,
        ]);

        $cuQua = Category::create([
            'parent_id' => null,
            'name' => 'Củ, Quả',
            'slug' => 'cu-qua',
            'description' => 'Các loại củ và quả tươi ngon, giàu dinh dưỡng, phù hợp cho bữa ăn hằng ngày.',
            'image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/ca-rot-da-lat_fty4u7.jpg',
            'status' => 1,
            'created_at' => $categoryDate->copy()->addMinutes(1),
            'updated_at' => $categoryDate->copy()->addMinutes(1),
        ]);

        $traiCay = Category::create([
            'parent_id' => null,
            'name' => 'Trái Cây',
            'slug' => 'trai-cay',
            'description' => 'Trái cây tươi ngon, giàu vitamin, có nguồn gốc rõ ràng và được tuyển chọn kỹ lưỡng.',
            'image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411004/xoai-cat-hoa-loc_bxphnc.jpg',
            'status' => 1,
            'created_at' => $categoryDate->copy()->addMinutes(2),
            'updated_at' => $categoryDate->copy()->addMinutes(2),
        ]);

        $gaoNguCoc = Category::create([
            'parent_id' => null,
            'name' => 'Gạo Và Ngũ Cốc',
            'slug' => 'gao-va-ngu-coc',
            'description' => 'Gạo và ngũ cốc chất lượng cao, cung cấp nguồn tinh bột và năng lượng lành mạnh.',
            'image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/gao-st25-soc-trang_r4dowq.webp',
            'status' => 1,
            'created_at' => $categoryDate->copy()->addMinutes(3),
            'updated_at' => $categoryDate->copy()->addMinutes(3),
        ]);

        $hatDinhDuong = Category::create([
            'parent_id' => null,
            'name' => 'Hạt Dinh Dưỡng',
            'slug' => 'hat-dinh-duong',
            'description' => 'Các loại hạt giàu protein, chất béo tốt, vitamin và khoáng chất cần thiết cho cơ thể.',
            'image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/hat-dieu-rang-moc_xlne75.jpg',
            'status' => 1,
            'created_at' => $categoryDate->copy()->addMinutes(4),
            'updated_at' => $categoryDate->copy()->addMinutes(4),
        ]);

        $botTinhBot = Category::create([
            'parent_id' => null,
            'name' => 'Bột Và Tinh Bột',
            'slug' => 'bot-va-tinh-bot',
            'description' => 'Các loại bột và tinh bột nguyên chất, thích hợp dùng trong chế biến món ăn và làm bánh.',
            'image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/bot-gao-nguyen-chat_xpxhgp.jpg',
            'status' => 1,
            'created_at' => $categoryDate->copy()->addMinutes(5),
            'updated_at' => $categoryDate->copy()->addMinutes(5),
        ]);

        // =====================================================
        // DANH MỤC CON
        // =====================================================

        $children = [
            [
                $rauLa->id,
                'Rau Muống',
                'rau-muong',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/rau-muong-huu-co_kzlhwn.jpg',
                'Rau muống tươi sạch, giòn ngon, giàu chất xơ và phù hợp cho nhiều món ăn gia đình.',
            ],
            [
                $rauLa->id,
                'Cải Xanh',
                'cai-xanh',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411001/cai-xanh-vietgap_gjbwc8.webp',
                'Cải xanh tươi non, giàu vitamin và được canh tác theo tiêu chuẩn an toàn.',
            ],
            [
                $rauLa->id,
                'Xà Lách',
                'xa-lach',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411004/xa-lach-thuy-canh_o9uhvf.jpg',
                'Xà lách tươi giòn, thích hợp làm salad, ăn kèm và chế biến các món ăn lành mạnh.',
            ],
            [
                $rauLa->id,
                'Rau Dền',
                'rau-den',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/rau-den-sach_swtb66.jpg',
                'Rau dền tươi sạch, giàu chất sắt, vitamin và khoáng chất tốt cho sức khỏe.',
            ],

            [
                $cuQua->id,
                'Cà Rốt',
                'ca-rot',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/ca-rot-da-lat_fty4u7.jpg',
                'Cà rốt tươi ngon, giàu beta-carotene, vitamin A và chất chống oxy hóa.',
            ],
            [
                $cuQua->id,
                'Khoai Lang',
                'khoai-lang',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/khoai-lang-nhat_pclfoy.jpg',
                'Khoai lang thơm bùi, giàu chất xơ và là nguồn tinh bột lành mạnh.',
            ],
            [
                $cuQua->id,
                'Bí Đỏ',
                'bi-do',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411001/bi-do-ho-lo_uhnkfu.jpg',
                'Bí đỏ ngọt tự nhiên, giàu vitamin và phù hợp chế biến nhiều món ăn bổ dưỡng.',
            ],
            [
                $cuQua->id,
                'Dưa Leo',
                'dua-leo',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/dua-leo-huu-co_ddw2ib.jpg',
                'Dưa leo tươi mát, giòn ngon, thích hợp ăn sống, làm salad hoặc nước ép.',
            ],

            [
                $traiCay->id,
                'Xoài',
                'xoai',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411004/xoai-cat-hoa-loc_bxphnc.jpg',
                'Xoài thơm ngọt, giàu vitamin C, vitamin A và các chất chống oxy hóa.',
            ],
            [
                $traiCay->id,
                'Bưởi',
                'buoi',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411001/buoi-da-xanh_p3f3xv.jpg',
                'Bưởi mọng nước, vị thanh ngọt, giàu vitamin C và tốt cho hệ tiêu hóa.',
            ],
            [
                $traiCay->id,
                'Cam',
                'cam',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411001/cam-sanh-mien-tay_o3pvfr.jpg',
                'Cam tươi mọng nước, giàu vitamin C và giúp tăng cường sức đề kháng.',
            ],
            [
                $traiCay->id,
                'Thanh Long',
                'thanh-long',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411004/thanh-long-ruot-do_oyf4av.png',
                'Thanh long tươi mát, giàu chất xơ, vitamin và các chất chống oxy hóa.',
            ],

            [
                $gaoNguCoc->id,
                'Gạo ST25',
                'gao-st25',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/gao-st25-soc-trang_r4dowq.webp',
                'Gạo ST25 thơm ngon, hạt dài, cơm mềm dẻo và có chất lượng cao.',
            ],
            [
                $gaoNguCoc->id,
                'Gạo Lứt',
                'gao-lut',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/gao-lut-huu-co_dlmu9n.jpg',
                'Gạo lứt giàu chất xơ, vitamin nhóm B và phù hợp với chế độ ăn lành mạnh.',
            ],
            [
                $gaoNguCoc->id,
                'Yến Mạch',
                'yen-mach',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411005/yen-mach-nguyen-hat_yvvvb0.webp',
                'Yến mạch nguyên hạt giàu chất xơ, protein và thích hợp dùng cho bữa sáng.',
            ],
            [
                $gaoNguCoc->id,
                'Bắp Mỹ',
                'bap-my',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411001/bap-my-ngot_pgi8tb.jpg',
                'Bắp Mỹ ngọt tự nhiên, hạt giòn và giàu vitamin cùng khoáng chất.',
            ],

            [
                $hatDinhDuong->id,
                'Hạt Điều',
                'hat-dieu',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/hat-dieu-rang-moc_xlne75.jpg',
                'Hạt điều thơm béo, giàu protein, chất béo tốt và các khoáng chất cần thiết.',
            ],
            [
                $hatDinhDuong->id,
                'Hạnh Nhân',
                'hanh-nhan',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/hanh-nhan-my_nytksg.jpg',
                'Hạnh nhân giòn thơm, giàu vitamin E, protein và chất béo không bão hòa.',
            ],
            [
                $hatDinhDuong->id,
                'Óc Chó',
                'oc-cho',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/hat-dieu-rang-moc_xlne75.jpg',
                'Hạt óc chó giàu omega-3, chất chống oxy hóa và hỗ trợ sức khỏe tim mạch.',
            ],
            [
                $hatDinhDuong->id,
                'Macca',
                'macca',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/hat-dieu-rang-moc_xlne75.jpg',
                'Hạt macca thơm béo, giàu chất béo tốt, vitamin và khoáng chất.',
            ],

            [
                $botTinhBot->id,
                'Bột Gạo',
                'bot-gao',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/bot-gao-nguyen-chat_xpxhgp.jpg',
                'Bột gạo nguyên chất, mịn, thơm và thích hợp chế biến nhiều món bánh truyền thống.',
            ],
            [
                $botTinhBot->id,
                'Bột Sắn',
                'bot-san',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/bot-gao-nguyen-chat_xpxhgp.jpg',
                'Bột sắn nguyên chất, dùng trong chế biến món ăn, làm bánh và tạo độ sánh.',
            ],
            [
                $botTinhBot->id,
                'Tinh Bột Nghệ',
                'tinh-bot-nghe',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411005/tinh-bot-nghe_bqiw4h.webp',
                'Tinh bột nghệ nguyên chất, giàu curcumin và thường được sử dụng để chăm sóc sức khỏe.',
            ],
            [
                $botTinhBot->id,
                'Bột Yến Mạch',
                'bot-yen-mach',
                'https://res.cloudinary.com/dumydknz7/image/upload/v1782411005/yen-mach-nguyen-hat_yvvvb0.webp',
                'Bột yến mạch giàu chất xơ, thích hợp làm bánh, pha thức uống và dùng trong chế độ ăn lành mạnh.',
            ],
        ];

        foreach ($children as $index => $item) {
            $childDate = $categoryDate
                ->copy()
                ->addMinutes(10 + $index);

            Category::create([
                'parent_id' => $item[0],
                'name' => $item[1],
                'slug' => $item[2],
                'image' => $item[3],
                'description' => $item[4],
                'status' => 1,
                'created_at' => $childDate,
                'updated_at' => $childDate,
            ]);
        }
    }
}
