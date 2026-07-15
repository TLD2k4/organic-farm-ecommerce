<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Certification;
use App\Models\Farm;
use App\Models\FarmPolicyAcceptance;
use App\Models\HarvestLot;
use App\Models\OrderItem;
use App\Models\OrderItemLot;
use App\Models\Product;
use App\Models\ProductCertificate;
use App\Models\ProductImage;
use App\Models\Review;
use App\Models\ReviewReply;
use App\Models\User;
use App\Notifications\MarketplaceNotification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class SystemTestScenarioSeeder extends Seeder
{
    private const PASSWORD = '12345678';

    private const POLICY_VERSION = 'demo-2026-07';

    public function run(): void
    {
        if (app()->environment('production')) {
            throw new RuntimeException(
                'SystemTestScenarioSeeder chỉ được dùng ở local hoặc staging.'
            );
        }

        DB::transaction(function () {
            $admin = User::role('admin')->orderBy('id')->firstOrFail();

            $this->normalizeBaseModerationData($admin);
            $this->seedCatalogScenarios();

            $accounts = $this->seedAccountAndFarmScenarios($admin);
            $products = $this->seedProductAndCertificateScenarios($admin);

            $this->seedInventoryScenarios($products);
            $this->syncAllProductStocks();
            $this->seedCartScenario();
            $this->seedOrderItemLotAllocations();

            $review = $this->seedReviewScenarios($admin);

            $this->seedAuditLogs($admin, $accounts, $products, $review);
            $this->seedNotifications($admin, $accounts, $products, $review);
        });

        $this->command?->newLine();
        $this->command?->info('Đã tạo dữ liệu kiểm thử toàn hệ thống.');
        $this->command?->table(
            ['Vai trò/kịch bản', 'Email', 'Mật khẩu'],
            [
                ['Admin', 'admin@organicfarm.vn', self::PASSWORD],
                ['Seller hoạt động', 'tranquochuy@gmail.com', self::PASSWORD],
                ['Customer có đơn/giỏ', 'nguyenvanduc@gmail.com', self::PASSWORD],
                ['Farm chờ duyệt', 'seller.pending@organicfarm.test', self::PASSWORD],
                ['Farm bị từ chối', 'seller.rejected@organicfarm.test', self::PASSWORD],
                ['Farm bị đình chỉ', 'seller.suspended@organicfarm.test', self::PASSWORD],
                ['Farm đã xóa mềm', 'seller.deleted@organicfarm.test', self::PASSWORD],
                ['Tài khoản bị khóa', 'customer.locked@organicfarm.test', self::PASSWORD],
                ['Tài khoản đã xóa', 'customer.deleted@organicfarm.test', self::PASSWORD],
            ]
        );
    }

    private function normalizeBaseModerationData(User $admin): void
    {
        Farm::query()
            ->where('status', Farm::STATUS_ACTIVE)
            ->get()
            ->each(function (Farm $farm) use ($admin) {
                $farm->update([
                    'approved_by' => $admin->id,
                    'approved_at' => $farm->approved_at
                        ?? $farm->created_at->copy()->addDay(),
                    'rejection_reason' => null,
                ]);

                $this->acceptPolicy($farm->seller_id, $farm);
            });

        Product::withoutGlobalScope('farm_not_deleted')
            ->where('status', 1)
            ->get()
            ->each(function (Product $product) use ($admin) {
                $product->update([
                    'approved_by' => $admin->id,
                    'approved_at' => $product->approved_at
                        ?? $product->created_at->copy()->addDays(2),
                    'rejection_reason' => null,
                ]);
            });

        ProductCertificate::query()
            ->where('status', 1)
            ->get()
            ->each(function (ProductCertificate $certificate) use ($admin) {
                $certificate->update([
                    'approved_by' => $admin->id,
                    'approved_at' => $certificate->approved_at
                        ?? $certificate->created_at,
                    'rejection_reason' => null,
                ]);
            });
    }

    private function seedAccountAndFarmScenarios(User $admin): array
    {
        $pendingUser = $this->upsertUser(
            'seller.pending@organicfarm.test',
            'Seller Chờ Duyệt',
            '0930000001',
            'customer'
        );
        $rejectedUser = $this->upsertUser(
            'seller.rejected@organicfarm.test',
            'Seller Bị Từ Chối',
            '0930000002',
            'customer'
        );
        $suspendedUser = $this->upsertUser(
            'seller.suspended@organicfarm.test',
            'Seller Bị Đình Chỉ',
            '0930000003',
            'seller'
        );
        $deletedFarmUser = $this->upsertUser(
            'seller.deleted@organicfarm.test',
            'Seller Farm Đã Xóa',
            '0930000004',
            'seller'
        );
        $lockedUser = $this->upsertUser(
            'customer.locked@organicfarm.test',
            'Khách Hàng Bị Khóa',
            '0930000005',
            'customer',
            0
        );
        $deletedUser = $this->upsertUser(
            'customer.deleted@organicfarm.test',
            'Khách Hàng Đã Xóa',
            '0930000006',
            'customer'
        );

        $pendingFarm = $this->upsertFarm(
            $pendingUser,
            'Nông Trại Demo Chờ Duyệt',
            'nong-trai-demo-cho-duyet',
            Farm::STATUS_PENDING
        );
        $rejectedFarm = $this->upsertFarm(
            $rejectedUser,
            'Nông Trại Demo Bị Từ Chối',
            'nong-trai-demo-bi-tu-choi',
            Farm::STATUS_REJECTED,
            $admin,
            'Ảnh giấy chứng nhận quyền sử dụng đất chưa rõ và địa chỉ chưa đầy đủ.'
        );
        $suspendedFarm = $this->upsertFarm(
            $suspendedUser,
            'Nông Trại Demo Bị Đình Chỉ',
            'nong-trai-demo-bi-dinh-chi',
            Farm::STATUS_SUSPENDED,
            $admin,
            'Tạm đình chỉ để xác minh phản ánh về nguồn gốc sản phẩm.'
        );
        $deletedFarm = $this->upsertFarm(
            $deletedFarmUser,
            'Nông Trại Demo Đã Xóa',
            'nong-trai-demo-da-xoa',
            Farm::STATUS_SUSPENDED,
            $admin,
            'Nông trại đã ngừng hoạt động và được xóa mềm để kiểm thử khôi phục.'
        );

        if (!$deletedFarm->trashed()) {
            $deletedFarm->delete();
        }

        if (!$deletedUser->trashed()) {
            $deletedUser->delete();
        }

        return compact(
            'pendingUser',
            'rejectedUser',
            'suspendedUser',
            'deletedFarmUser',
            'lockedUser',
            'deletedUser',
            'pendingFarm',
            'rejectedFarm',
            'suspendedFarm',
            'deletedFarm'
        );
    }

    private function seedCatalogScenarios(): void
    {
        $hiddenCategory = Category::withTrashed()->firstOrNew([
            'slug' => 'danh-muc-demo-dang-an',
        ]);
        if ($hiddenCategory->exists && $hiddenCategory->trashed()) {
            $hiddenCategory->restore();
        }
        $hiddenCategory->fill([
            'parent_id' => null,
            'name' => 'Danh Mục Demo Đang Ẩn',
            'description' => 'Danh mục mẫu để kiểm thử thao tác hiện và ẩn.',
            'image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/rau-muong-huu-co_kzlhwn.jpg',
            'status' => 0,
        ]);
        $hiddenCategory->deleted_at = null;
        $hiddenCategory->save();

        $deletedCategory = Category::withTrashed()->firstOrNew([
            'slug' => 'danh-muc-demo-da-xoa',
        ]);
        if ($deletedCategory->exists && $deletedCategory->trashed()) {
            $deletedCategory->restore();
        }
        $deletedCategory->fill([
            'parent_id' => null,
            'name' => 'Danh Mục Demo Đã Xóa',
            'description' => 'Danh mục mẫu để kiểm thử khôi phục và xóa vĩnh viễn.',
            'image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411002/ca-rot-da-lat_fty4u7.jpg',
            'status' => 0,
        ]);
        $deletedCategory->deleted_at = null;
        $deletedCategory->save();
        $deletedCategory->delete();

        $hiddenCertification = Certification::withTrashed()->firstOrNew([
            'name' => 'Demo Đang Ẩn',
        ]);
        if ($hiddenCertification->exists && $hiddenCertification->trashed()) {
            $hiddenCertification->restore();
        }
        $hiddenCertification->fill([
            'description' => 'Chứng nhận mẫu để kiểm thử thao tác hiện và ẩn.',
            'status' => 0,
        ]);
        $hiddenCertification->deleted_at = null;
        $hiddenCertification->save();

        $deletedCertification = Certification::withTrashed()->firstOrNew([
            'name' => 'Demo Đã Xóa',
        ]);
        if ($deletedCertification->exists && $deletedCertification->trashed()) {
            $deletedCertification->restore();
        }
        $deletedCertification->fill([
            'description' => 'Chứng nhận mẫu để kiểm thử khôi phục.',
            'status' => 0,
        ]);
        $deletedCertification->deleted_at = null;
        $deletedCertification->save();
        $deletedCertification->delete();
    }

    private function seedProductAndCertificateScenarios(User $admin): array
    {
        $farm = Farm::query()
            ->where('status', Farm::STATUS_ACTIVE)
            ->orderBy('id')
            ->firstOrFail();
        $category = Category::query()
            ->whereNotNull('parent_id')
            ->where('status', 1)
            ->orderBy('id')
            ->firstOrFail();
        $certification = Certification::query()
            ->where('status', 1)
            ->orderBy('id')
            ->firstOrFail();

        $pending = $this->upsertProductScenario(
            $farm,
            $category,
            $certification,
            'Sản Phẩm Demo Chờ Duyệt',
            'san-pham-demo-cho-duyet',
            0,
            0,
            'TEST-PENDING-001'
        );
        $rejected = $this->upsertProductScenario(
            $farm,
            $category,
            $certification,
            'Sản Phẩm Demo Bị Từ Chối',
            'san-pham-demo-bi-tu-choi',
            2,
            2,
            'TEST-REJECTED-001',
            $admin,
            'Thông tin trên chứng chỉ không khớp với tên sản phẩm.'
        );
        $hidden = $this->upsertProductScenario(
            $farm,
            $category,
            $certification,
            'Sản Phẩm Demo Tạm Ẩn',
            'san-pham-demo-tam-an',
            3,
            1,
            'TEST-HIDDEN-001',
            $admin
        );
        $expired = $this->upsertProductScenario(
            $farm,
            $category,
            $certification,
            'Sản Phẩm Demo Hết Chứng Chỉ',
            'san-pham-demo-het-chung-chi',
            1,
            3,
            'TEST-EXPIRED-001',
            $admin
        );
        $deleted = $this->upsertProductScenario(
            $farm,
            $category,
            $certification,
            'Sản Phẩm Demo Đã Xóa',
            'san-pham-demo-da-xoa',
            3,
            1,
            'TEST-DELETED-001',
            $admin
        );

        if (!$deleted['product']->trashed()) {
            $deleted['product']->delete();
        }

        $baseProduct = Product::query()
            ->where('farm_id', $farm->id)
            ->where('status', 1)
            ->where('id', '!=', $expired['product']->id)
            ->orderBy('id')
            ->firstOrFail();

        ProductCertificate::withTrashed()->updateOrCreate(
            ['certificate_number' => 'TEST-RENEW-PENDING-001'],
            [
                'product_id' => $baseProduct->id,
                'certification_id' => $certification->id,
                'certificate_file' => 'certificates/test-renew-pending-001.pdf',
                'issued_date' => today()->subDays(15),
                'expiry_date' => today()->addYear(),
                'status' => 0,
                'approved_by' => null,
                'approved_at' => null,
                'rejection_reason' => null,
                'deleted_at' => null,
            ]
        );

        return compact(
            'farm',
            'baseProduct',
            'pending',
            'rejected',
            'hidden',
            'expired',
            'deleted'
        );
    }

    private function seedInventoryScenarios(array $products): void
    {
        $baseCertificate = ProductCertificate::query()
            ->where('product_id', $products['baseProduct']->id)
            ->where('status', 1)
            ->whereDate('expiry_date', '>=', today())
            ->orderBy('id')
            ->firstOrFail();

        $this->upsertLot(
            $baseCertificate,
            'TSTHID001',
            today()->subDays(10),
            today()->addDays(30),
            20,
            0,
            20,
            2,
            'Lô tạm ẩn để kiểm thử bật lại.'
        );
        $this->upsertLot(
            $baseCertificate,
            'TSTSOLD01',
            today()->subDays(20),
            today()->addDays(20),
            30,
            30,
            0,
            3,
            'Lô đã bán hết.'
        );
        $this->upsertLot(
            $baseCertificate,
            'TSTEXP001',
            today()->subDays(45),
            today()->subDay(),
            20,
            5,
            15,
            4,
            'Lô đã hết hạn sử dụng.'
        );

        $this->upsertLot(
            $products['hidden']['certificate'],
            'TSTHPR001',
            today()->subDays(5),
            today()->addDays(40),
            18,
            0,
            18,
            1,
            'Còn tồn kho nhưng sản phẩm đang tạm ẩn.'
        );
        $this->upsertLot(
            $products['expired']['certificate'],
            'TSTXPR001',
            today()->subDays(60),
            today()->subDay(),
            12,
            0,
            12,
            4,
            'Lô không được bán vì chứng chỉ và hạn sử dụng đã hết.'
        );
    }

    private function syncAllProductStocks(): void
    {
        Product::withoutGlobalScope('farm_not_deleted')
            ->withTrashed()
            ->get()
            ->each(function (Product $product) {
                $stock = HarvestLot::query()
                    ->whereHas('productCertificate', function ($query) use ($product) {
                        $query
                            ->where('product_id', $product->id)
                            ->where('status', 1)
                            ->whereDate('expiry_date', '>=', today());
                    })
                    ->where('status', 1)
                    ->whereDate('expiry_date', '>=', today())
                    ->sum('quantity_remaining');

                Product::withoutGlobalScope('farm_not_deleted')
                    ->withTrashed()
                    ->whereKey($product->id)
                    ->update(['stock_quantity' => $stock]);
            });
    }

    private function seedCartScenario(): void
    {
        $buyer = User::query()
            ->where('email', 'nguyenvanduc@gmail.com')
            ->firstOrFail();
        $cart = Cart::firstOrCreate(['user_id' => $buyer->id]);

        $cart->items()->delete();

        $products = Product::query()
            ->where('status', 1)
            ->where('stock_quantity', '>', 5)
            ->whereHas('certificate')
            ->orderBy('id')
            ->get()
            ->unique('farm_id')
            ->take(2)
            ->values();

        if ($products->isEmpty()) {
            throw new RuntimeException(
                'Không thể tạo giỏ kiểm thử: thiếu sản phẩm còn hàng với chứng chỉ hợp lệ.'
            );
        }

        foreach ($products as $index => $product) {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'quantity' => $index + 1,
            ]);
        }
    }

    private function seedOrderItemLotAllocations(): void
    {
        OrderItem::query()
            ->with('subOrder.order')
            ->orderBy('id')
            ->get()
            ->each(function (OrderItem $item) {
                if ((int) $item->subOrder?->order?->status === 4) {
                    $item->orderItemLots()
                        ->withTrashed()
                        ->get()
                        ->each(fn (OrderItemLot $allocation) => $allocation->forceDelete());

                    return;
                }

                $lot = HarvestLot::query()
                    ->whereHas('productCertificate', function ($query) use ($item) {
                        $query->where('product_id', $item->product_id);
                    })
                    ->whereIn('status', [1, 3])
                    ->orderBy('harvest_date')
                    ->orderBy('id')
                    ->first();

                if (!$lot) {
                    return;
                }

                $allocation = OrderItemLot::withTrashed()->firstOrNew([
                    'order_item_id' => $item->id,
                    'harvest_lot_id' => $lot->id,
                ]);
                $allocation->quantity = $item->quantity;
                $allocation->deleted_at = null;
                $allocation->save();
            });
    }

    private function seedReviewScenarios(User $admin): Review
    {
        $baseReview = Review::query()
            ->whereNotNull('order_item_id')
            ->where('status', 1)
            ->with('product.farm.seller')
            ->orderBy('id')
            ->firstOrFail();

        $seller = $baseReview->product?->farm?->seller;

        if ($seller) {
            ReviewReply::withTrashed()->updateOrCreate(
                [
                    'review_id' => $baseReview->id,
                    'user_id' => $seller->id,
                    'comment' => 'Cảm ơn bạn đã ủng hộ nông trại. Chúng tôi sẽ tiếp tục giữ chất lượng!',
                ],
                ['status' => 1, 'deleted_at' => null]
            );
        }

        ReviewReply::withTrashed()->updateOrCreate(
            [
                'review_id' => $baseReview->id,
                'user_id' => $admin->id,
                'comment' => 'Quản trị viên đã ghi nhận phản hồi và cảm ơn bạn đã đánh giá.',
            ],
            ['status' => 1, 'deleted_at' => null]
        );

        Review::withTrashed()->updateOrCreate(
            [
                'user_id' => $admin->id,
                'order_item_id' => null,
                'product_id' => $baseReview->product_id,
                'comment' => 'Bình luận trực tiếp của quản trị viên để kiểm thử trường hợp không cần mua hàng.',
            ],
            [
                'rating' => null,
                'status' => 1,
                'moderated_by' => null,
                'moderated_at' => null,
                'moderation_reason' => null,
                'deleted_at' => null,
            ]
        );

        $reviewToDelete = Review::query()
            ->whereNotNull('order_item_id')
            ->where('id', '!=', $baseReview->id)
            ->where('status', 1)
            ->orderByDesc('id')
            ->first();

        if ($reviewToDelete && !$reviewToDelete->trashed()) {
            $reviewToDelete->delete();
        }

        return $baseReview;
    }

    private function seedAuditLogs(
        User $admin,
        array $accounts,
        array $products,
        Review $review
    ): void {
        AuditLog::query()
            ->where('context->seed', 'system_test')
            ->delete();

        $this->audit(
            $admin,
            'farm',
            $accounts['rejectedFarm']->id,
            'reject',
            0,
            2,
            $accounts['rejectedFarm']->rejection_reason,
            ['seller_id' => $accounts['rejectedUser']->id],
            now()->subDays(6)
        );
        $this->audit(
            $admin,
            'farm',
            $accounts['suspendedFarm']->id,
            'suspend',
            1,
            3,
            $accounts['suspendedFarm']->rejection_reason,
            ['seller_id' => $accounts['suspendedUser']->id],
            now()->subDays(4)
        );
        $this->audit(
            $admin,
            'farm',
            $accounts['deletedFarm']->id,
            'soft_delete',
            3,
            'deleted',
            $accounts['deletedFarm']->rejection_reason,
            ['seller_id' => $accounts['deletedFarmUser']->id],
            now()->subDays(2)
        );
        $this->audit(
            $admin,
            'user',
            $accounts['lockedUser']->id,
            'lock',
            1,
            0,
            'Khóa tài khoản mẫu để kiểm thử chặn đăng nhập.',
            [],
            now()->subDays(3)
        );
        $this->audit(
            $admin,
            'user',
            $accounts['deletedUser']->id,
            'soft_delete',
            1,
            'deleted',
            'Xóa mềm tài khoản mẫu để kiểm thử khôi phục.',
            [],
            now()->subDay()
        );
        $this->audit(
            $admin,
            'product',
            $products['rejected']['product']->id,
            'reject',
            0,
            2,
            $products['rejected']['product']->rejection_reason,
            ['seller_id' => $products['farm']->seller_id],
            now()->subDays(5)
        );
        $this->audit(
            $admin,
            'product_certificate',
            $products['rejected']['certificate']->id,
            'reject',
            0,
            2,
            $products['rejected']['certificate']->rejection_reason,
            [
                'seller_id' => $products['farm']->seller_id,
                'product_id' => $products['rejected']['product']->id,
            ],
            now()->subDays(5)->addHour()
        );
        $this->audit(
            $admin,
            'review',
            $review->id,
            'reply',
            null,
            null,
            null,
            ['buyer_id' => $review->user_id],
            now()->subHours(8)
        );
    }

    private function seedNotifications(
        User $admin,
        array $accounts,
        array $products,
        Review $review
    ): void {
        $seller = $products['farm']->seller;
        $buyer = $review->user;

        foreach (collect([$admin, $seller, $buyer, $accounts['rejectedUser'], $accounts['suspendedUser']])->filter() as $user) {
            $user->notifications()
                ->where('data', 'like', '%system_test%')
                ->delete();
        }

        $this->notify(
            $admin,
            'farm.submitted',
            'Nông trại mới chờ duyệt',
            $accounts['pendingFarm']->name . ' đang chờ kiểm duyệt.',
            '/admin/farms',
            $accounts['pendingUser'],
            ['farm_id' => $accounts['pendingFarm']->id],
            now()->subMinutes(12)
        );
        $this->notify(
            $admin,
            'product.submitted',
            'Sản phẩm mới chờ duyệt',
            $products['pending']['product']->name . ' đang chờ kiểm duyệt.',
            '/admin/products',
            $seller,
            ['product_id' => $products['pending']['product']->id],
            now()->subMinutes(8)
        );
        $this->notify(
            $accounts['rejectedUser'],
            'farm.rejected',
            'Hồ sơ nông trại bị từ chối',
            'Lý do: ' . $accounts['rejectedFarm']->rejection_reason,
            '/seller/register',
            $admin,
            ['farm_id' => $accounts['rejectedFarm']->id],
            now()->subDays(6)
        );
        $this->notify(
            $accounts['suspendedUser'],
            'farm.suspended',
            'Nông trại bị đình chỉ',
            'Lý do: ' . $accounts['suspendedFarm']->rejection_reason,
            '/seller/farm',
            $admin,
            ['farm_id' => $accounts['suspendedFarm']->id],
            now()->subDays(4)
        );
        $this->notify(
            $seller,
            'product.rejected',
            'Sản phẩm bị từ chối',
            'Lý do: ' . $products['rejected']['product']->rejection_reason,
            '/seller/products',
            $admin,
            ['product_id' => $products['rejected']['product']->id],
            now()->subDays(5)
        );
        $this->notify(
            $seller,
            'review.created',
            'Sản phẩm có đánh giá mới',
            $buyer->name . ' vừa đánh giá sản phẩm ' . $review->product?->name . '.',
            '/seller/reviews',
            $buyer,
            ['review_id' => $review->id],
            now()->subHours(10)
        );
        $this->notify(
            $buyer,
            'review.replied',
            'Người bán đã trả lời đánh giá',
            'Cảm ơn bạn đã ủng hộ nông trại. Chúng tôi sẽ tiếp tục giữ chất lượng!',
            '/profile?tab=reviews',
            $seller,
            ['review_id' => $review->id],
            now()->subHours(9),
            true
        );
    }

    private function upsertUser(
        string $email,
        string $name,
        string $phone,
        string $role,
        int $status = 1
    ): User {
        $user = User::withTrashed()->firstOrNew(['email' => $email]);

        if ($user->exists && $user->trashed()) {
            $user->restore();
        }

        $user->fill([
            'name' => $name,
            'phone' => $phone,
            'password' => self::PASSWORD,
            'status' => $status,
        ]);
        $user->save();
        $user->syncRoles([$role]);

        return $user->fresh();
    }

    private function upsertFarm(
        User $seller,
        string $name,
        string $slug,
        int $status,
        ?User $admin = null,
        ?string $reason = null
    ): Farm {
        $farm = Farm::withTrashed()->firstOrNew(['seller_id' => $seller->id]);

        if ($farm->exists && $farm->trashed()) {
            $farm->restore();
        }

        $farm->fill([
            'name' => $name,
            'slug' => $slug,
            'description' => 'Dữ liệu mẫu phục vụ kiểm thử đầy đủ quy trình quản lý nông trại.',
            'logo' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782464963/farm2_zxq2jt.png',
            'cover_image' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782465301/cover_image_farm2_sbybwr.webp',
            'phone' => $seller->phone,
            'address' => '123 Đường Kiểm Thử, Phường Demo, TP. Hồ Chí Minh',
            'status' => $status,
            'approved_by' => $admin?->id,
            'approved_at' => $admin ? now()->subDays(7) : null,
            'rejection_reason' => $reason,
        ]);
        $farm->deleted_at = null;
        $farm->save();

        $this->acceptPolicy($seller->id, $farm);

        return $farm->fresh();
    }

    private function acceptPolicy(int $userId, Farm $farm): void
    {
        FarmPolicyAcceptance::updateOrCreate(
            [
                'user_id' => $userId,
                'farm_id' => $farm->id,
                'policy_version' => self::POLICY_VERSION,
            ],
            [
                'accepted_at' => $farm->created_at ?? now(),
                'ip_address' => '127.0.0.1',
                'user_agent' => 'SystemTestScenarioSeeder/1.0',
            ]
        );
    }

    private function upsertProductScenario(
        Farm $farm,
        Category $category,
        Certification $certification,
        string $name,
        string $slug,
        int $productStatus,
        int $certificateStatus,
        string $certificateNumber,
        ?User $admin = null,
        ?string $reason = null
    ): array {
        $product = Product::withoutGlobalScope('farm_not_deleted')
            ->withTrashed()
            ->firstOrNew(['slug' => $slug]);

        if ($product->exists && $product->trashed()) {
            $product->restore();
        }

        $product->fill([
            'farm_id' => $farm->id,
            'category_id' => $category->id,
            'name' => $name,
            'description' => 'Sản phẩm mẫu dùng để kiểm thử trạng thái duyệt, từ chối, chỉnh sửa và khôi phục.',
            'price' => 45000,
            'sale_price' => 39000,
            'stock_quantity' => 0,
            'unit' => 'kg',
            'thumbnail' => 'https://res.cloudinary.com/dumydknz7/image/upload/v1782411003/rau-muong-huu-co_kzlhwn.jpg',
            'is_hot' => false,
            'status' => $productStatus,
            'approved_by' => $admin?->id,
            'approved_at' => $admin ? now()->subDays(5) : null,
            'rejection_reason' => $reason,
        ]);
        $product->deleted_at = null;
        $product->save();

        ProductImage::updateOrCreate(
            [
                'product_id' => $product->id,
                'image_url' => $product->thumbnail,
            ]
        );

        $expired = $certificateStatus === 3;
        $certificate = ProductCertificate::withTrashed()->firstOrNew([
            'certificate_number' => $certificateNumber,
        ]);
        $certificate->fill([
            'product_id' => $product->id,
            'certification_id' => $certification->id,
            'certificate_file' => 'certificates/' . strtolower($certificateNumber) . '.pdf',
            'issued_date' => $expired ? today()->subYear() : today()->subMonth(),
            'expiry_date' => $expired ? today()->subDay() : today()->addYear(),
            'status' => $certificateStatus,
            'approved_by' => $admin?->id,
            'approved_at' => $admin ? now()->subDays(5) : null,
            'rejection_reason' => $certificateStatus === 2 ? $reason : null,
        ]);
        $certificate->deleted_at = null;
        $certificate->save();

        return compact('product', 'certificate');
    }

    private function upsertLot(
        ProductCertificate $certificate,
        string $code,
        Carbon $harvestDate,
        Carbon $expiryDate,
        float $imported,
        float $sold,
        float $remaining,
        int $status,
        string $note
    ): void {
        HarvestLot::withTrashed()->updateOrCreate(
            ['lot_code' => $code],
            [
                'product_certificate_id' => $certificate->id,
                'harvest_date' => $harvestDate->toDateString(),
                'expiry_date' => $expiryDate->toDateString(),
                'quantity_imported' => $imported,
                'quantity_sold' => $sold,
                'quantity_remaining' => $remaining,
                'status' => $status,
                'note' => $note,
                'deleted_at' => null,
            ]
        );
    }

    private function audit(
        User $actor,
        string $subjectType,
        int $subjectId,
        string $action,
        int|string|null $fromStatus,
        int|string|null $toStatus,
        ?string $reason,
        array $context,
        Carbon $at
    ): void {
        $log = new AuditLog([
            'actor_id' => $actor->id,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'action' => $action,
            'from_status' => $fromStatus === null ? null : (string) $fromStatus,
            'to_status' => $toStatus === null ? null : (string) $toStatus,
            'reason' => $reason,
            'context' => [...$context, 'seed' => 'system_test'],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'SystemTestScenarioSeeder/1.0',
        ]);
        $log->created_at = $at;
        $log->updated_at = $at;
        $log->save();
    }

    private function notify(
        User $recipient,
        string $eventType,
        string $title,
        string $message,
        string $url,
        ?User $actor,
        array $context,
        Carbon $at,
        bool $read = false
    ): void {
        $recipient->notify(new MarketplaceNotification(
            $eventType,
            $title,
            $message,
            $url,
            $actor,
            [...$context, 'seed' => 'system_test']
        ));

        $notification = $recipient->notifications()
            ->where('data', 'like', '%system_test%')
            ->latest('created_at')
            ->first();

        if (!$notification) {
            return;
        }

        $notification->forceFill([
            'created_at' => $at,
            'updated_at' => $at,
            'read_at' => $read ? $at->copy()->addMinute() : null,
        ])->save();
    }
}
