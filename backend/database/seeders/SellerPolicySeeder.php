<?php

namespace Database\Seeders;

use App\Models\SellerPolicy;
use App\Models\User;
use Illuminate\Database\Seeder;

class SellerPolicySeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::role('admin')->first();
        $summary = implode("\n", [
            'Cung cấp thông tin nông trại và người bán trung thực, có thể xác minh.',
            'Chỉ bán nông sản hợp pháp, rõ nguồn gốc, còn hạn và bảo đảm an toàn.',
            'Chịu trách nhiệm về chứng nhận, giá, tồn kho, giao hàng và khiếu nại.',
            'Nền tảng có thể ẩn sản phẩm hoặc đình chỉ gian hàng khi có vi phạm.',
        ]);
        $content = <<<'POLICY'
1. Phạm vi và điều kiện tham gia
Người đăng ký phải có tài khoản hợp lệ, cung cấp thông tin nông trại chính xác và chịu trách nhiệm về hoạt động bán hàng.

2. Xét duyệt và trạng thái nông trại
Hồ sơ có thể chờ duyệt, hoạt động, bị từ chối hoặc đình chỉ. Hồ sơ bị từ chối được chỉnh sửa và gửi lại.

3. Nguồn gốc, chất lượng và an toàn nông sản
Không đăng hàng cấm, hàng giả, hàng không rõ nguồn gốc, hư hỏng hoặc quá hạn. Người bán phải phối hợp truy xuất và thu hồi khi cần.

4. Chứng nhận sản phẩm
Chỉ sử dụng tuyên bố hữu cơ, VietGAP, GlobalGAP hoặc tương tự khi có chứng nhận hợp lệ và có thể kiểm chứng.

5. Nội dung sản phẩm, giá và tồn kho
Tên, hình ảnh, mô tả, giá, đơn vị và tồn kho phải đúng thực tế; không quảng cáo sai hoặc thao túng đánh giá.

6. Đơn hàng, đóng gói và giao nhận
Người bán phải xử lý đơn đúng hạn, đóng gói phù hợp và thông báo sớm khi thiếu hàng hoặc không thể thực hiện đơn.

7. Đổi trả, hoàn tiền và khiếu nại
Người bán phải tiếp nhận khiếu nại, cung cấp chứng cứ và phối hợp đổi trả hoặc hoàn tiền theo chính sách giao dịch.

8. Phí, thuế và nghĩa vụ tài chính
Phí nền tảng phải được công bố; người bán tự chịu trách nhiệm về thuế, hóa đơn và nghĩa vụ tài chính của mình.

9. Bảo vệ dữ liệu cá nhân
Dữ liệu được xử lý để vận hành, bảo mật và giải quyết tranh chấp trong phạm vi đã thông báo và theo pháp luật.

10. Vi phạm, đình chỉ và chấm dứt
Tùy mức độ, nền tảng có thể nhắc nhở, yêu cầu khắc phục, ẩn sản phẩm, hạn chế tính năng, đình chỉ hoặc chấm dứt gian hàng.

11. Thay đổi chính sách và giải quyết tranh chấp
Phiên bản mới ghi rõ ngày hiệu lực. Thay đổi quan trọng có thể yêu cầu người bán chấp thuận lại. Tranh chấp ưu tiên thương lượng và hỗ trợ trên nền tảng.
POLICY;

        SellerPolicy::updateOrCreate(
            ['version' => '2026.01'],
            [
                'title' => 'Chính sách và thỏa thuận người bán',
                'summary' => $summary,
                'content' => $content,
                'status' => SellerPolicy::STATUS_PUBLISHED,
                'requires_reacceptance' => true,
                'effective_at' => '2026-07-01 00:00:00',
                'created_by' => $admin?->id,
                'updated_by' => $admin?->id,
                'published_by' => $admin?->id,
                'published_at' => now(),
                'change_note' => 'Phiên bản chính sách khởi tạo.',
            ]
        );
    }
}
