<?php

namespace App\Http\Controllers\Farm;

use App\Http\Controllers\Controller;
use App\Http\Requests\Farm\AdminFarmIndexRequest;
use App\Http\Requests\Farm\RegisterFarmRequest;
use App\Http\Requests\Farm\RejectFarmRequest;
use App\Http\Requests\Farm\UpdateFarmRequest;
use App\Services\Farm\FarmService;
use App\Services\Audit\AuditLogService;
use App\Models\User;
use App\Models\Farm;
use App\Notifications\MarketplaceNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FarmController extends Controller
{
    public function __construct(
        private FarmService $farmService,
        private AuditLogService $auditLogService
    ) {}

    // =====================================================
    // PUBLIC
    // =====================================================

    public function index(Request $request)
    {
        $filters = [
            'limit' => max(
                1,
                min(
                    (int) $request->input('limit', 12),
                    50
                )
            ),
            'keyword' => $request->input('keyword'),
        ];

        $farms = $this->farmService->getAll($filters);

        return response()->json([
            'success' => true,
            'data' => $farms->items(),
            'meta' => [
                'total' => $farms->total(),
                'per_page' => $farms->perPage(),
                'current_page' => $farms->currentPage(),
                'last_page' => $farms->lastPage(),
                'from' => $farms->firstItem(),
                'to' => $farms->lastItem(),
            ],
        ]);
    }

    public function show(Request $request, string $slug)
    {
        $filters = $request->validate([
            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:24',
            ],
        ]);

        $filters['page'] = $filters['page'] ?? 1;
        $filters['per_page'] = $filters['per_page'] ?? 12;

        return response()->json([
            'success' => true,
            'data' => $this->farmService->getBySlug(
                $slug,
                $filters
            ),
        ]);
    }

    // =====================================================
    // OWNER
    // =====================================================

    public function register(RegisterFarmRequest $request)
    {
        $validated = $request->validated();

        $policyAcceptance = [
            'policy_version' => $validated['policy_version'],
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit(
                (string) $request->userAgent(),
                1000,
                ''
            ),
        ];

        /*
         * Hai field consent chỉ dùng để xác thực và ghi lịch sử,
         * không được truyền vào Farm::create().
         */
        unset(
            $validated['policy_accepted'],
            $validated['policy_version']
        );

        $farm = $this->farmService->register(
            $request->user(),
            $validated,
            $policyAcceptance
        );

        $isAdmin = $request->user()->hasRole('admin');

        if (!$isAdmin) {
            $this->notifyAdminsOfFarmSubmission(
                $request->user(),
                $farm,
                'farm.submitted',
                'Nông trại mới chờ duyệt'
            );
        }

        return response()->json([
            'success' => true,
            'message' => $isAdmin
                ? 'Đăng ký nông trại thành công. Nông trại đã được kích hoạt.'
                : 'Đăng ký nông trại thành công. Vui lòng chờ quản trị viên xét duyệt.',
            'data' => $farm,
        ], 201);
    }

    public function myFarm(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $this->farmService->getMyFarm(
                $request->user()
            ),
        ]);
    }

    public function update(UpdateFarmRequest $request, $id)
    {
        $farm = $this->farmService->updateOwnedFarm(
            $request->user(),
            (int) $id,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thông tin nông trại thành công.',
            'data' => $farm,
        ]);
    }

    public function resubmit(Request $request, $id)
    {
        $farm = $this->farmService->resubmit(
            $request->user(),
            (int) $id
        );

        $this->notifyAdminsOfFarmSubmission(
            $request->user(),
            $farm,
            'farm.resubmitted',
            'Hồ sơ nông trại được gửi duyệt lại'
        );

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi lại hồ sơ nông trại để chờ duyệt.',
            'data' => $farm,
        ]);
    }

    public function ownerForceDestroy(Request $request, $id)
    {
        $farm = $this->farmService->ownerForceDelete(
            $request->user(),
            (int) $id
        );

        return response()->json([
            'success' => true,
            'message' => 'Xóa vĩnh viễn hồ sơ nông trại thành công.',
            'data' => [
                'id' => $farm->id,
                'name' => $farm->name,
                'seller_id' => $farm->seller_id,
            ],
        ]);
    }

    // =====================================================
    // ADMIN
    // =====================================================

    public function adminIndex(AdminFarmIndexRequest $request)
    {
        $filters = $request->validated();
        $filters['limit'] = $filters['limit'] ?? 10;

        $farms = $this->farmService->adminGetAll($filters);

        return response()->json([
            'success' => true,
            'data' => $farms->items(),
            'meta' => [
                'total' => $farms->total(),
                'per_page' => $farms->perPage(),
                'current_page' => $farms->currentPage(),
                'last_page' => $farms->lastPage(),
                'from' => $farms->firstItem(),
                'to' => $farms->lastItem(),
            ],
        ]);
    }

    public function adminShow($id)
    {
        return response()->json([
            'success' => true,
            'data' => $this->farmService->adminGetById((int) $id),
        ]);
    }

    public function approve(Request $request, $id)
    {
        $farm = $this->farmService->approve(
            $request->user(),
            (int) $id
        );

        $this->auditLogService->record(
            $request->user(), 'farm', (int) $id, 'approve', 0, 1,
            null, ['seller_id' => $farm->seller_id]
        );
        $this->notifySeller(
            $request->user(), $farm, 'farm.approved',
            'Nông trại đã được duyệt',
            'Hồ sơ nông trại của bạn đã được duyệt.'
        );

        return response()->json([
            'success' => true,
            'message' => 'Duyệt nông trại thành công.',
            'data' => $farm,
        ]);
    }

    public function reject(RejectFarmRequest $request, $id)
    {
        $farm = $this->farmService->reject(
            $request->user(),
            (int) $id,
            $request->validated('rejection_reason')
        );

        $this->auditLogService->record(
            $request->user(), 'farm', (int) $id, 'reject', 0, 2,
            $request->validated('rejection_reason'),
            ['seller_id' => $farm->seller_id]
        );
        $this->notifySeller(
            $request->user(), $farm, 'farm.rejected',
            'Hồ sơ nông trại bị từ chối',
            'Lý do: ' . $request->validated('rejection_reason')
        );

        return response()->json([
            'success' => true,
            'message' => 'Từ chối nông trại thành công.',
            'data' => $farm,
        ]);
    }

    public function suspend(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $farm = $this->farmService->suspend(
            $request->user(),
            (int) $id,
            $validated['reason']
        );

        $this->auditLogService->record(
            $request->user(), 'farm', (int) $id, 'suspend', 1, 3,
            $validated['reason'], ['seller_id' => $farm->seller_id]
        );
        $this->notifySeller(
            $request->user(), $farm, 'farm.suspended',
            'Nông trại bị đình chỉ',
            'Lý do: ' . $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => 'Đình chỉ nông trại thành công.',
            'data' => $farm,
        ]);
    }

    public function reopen(Request $request, $id)
    {
        $farm = $this->farmService->reopen($request->user(), (int) $id);

        $this->auditLogService->record(
            $request->user(), 'farm', (int) $id, 'reopen', 3, 1,
            null, ['seller_id' => $farm->seller_id]
        );
        $this->notifySeller(
            $request->user(), $farm, 'farm.reopened',
            'Nông trại đã được mở lại',
            'Gian hàng của bạn đã được phép hoạt động trở lại.'
        );

        return response()->json([
            'success' => true,
            'message' => 'Mở lại nông trại thành công.',
            'data' => $farm,
        ]);
    }

    public function adminDestroy(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $farm = $this->farmService->adminSoftDelete(
            $request->user(),
            (int) $id,
            $validated['reason']
        );

        $this->auditLogService->record(
            $request->user(), 'farm', (int) $id, 'soft_delete',
            $farm->status, 'deleted', $validated['reason'],
            ['seller_id' => $farm->seller_id]
        );

        return response()->json([
            'success' => true,
            'message' => 'Xóa mềm nông trại thành công.',
            'data' => $farm,
        ]);
    }

    public function restore(Request $request, $id)
    {
        $farm = $this->farmService->restore($request->user(), (int) $id);

        $this->auditLogService->record(
            $request->user(), 'farm', (int) $id, 'restore',
            'deleted', $farm->status, null,
            ['seller_id' => $farm->seller_id]
        );

        return response()->json([
            'success' => true,
            'message' => 'Khôi phục nông trại thành công.',
            'data' => $farm,
        ]);
    }

    public function forceDestroy(Request $request, $id)
    {
        $farm = $this->farmService->forceDelete((int) $id);

        $this->auditLogService->record(
            $request->user(), 'farm', (int) $id, 'force_delete',
            'deleted', 'purged', null,
            ['seller_id' => $farm->seller_id, 'farm_name' => $farm->name]
        );

        return response()->json([
            'success' => true,
            'message' => 'Xóa vĩnh viễn nông trại thành công.',
            'data' => [
                'id' => $farm->id,
                'name' => $farm->name,
                'seller_id' => $farm->seller_id,
            ],
        ]);
    }

    private function notifySeller(
        User $admin,
        Farm $farm,
        string $eventType,
        string $title,
        string $message
    ): void {
        $url = $eventType === 'farm.rejected'
            ? '/seller/register'
            : '/seller/farm';

        $farm->seller?->notify(new MarketplaceNotification(
            $eventType,
            $title,
            $message,
            $url,
            $admin,
            ['farm_id' => $farm->id]
        ));
    }

    private function notifyAdminsOfFarmSubmission(
        User $seller,
        Farm $farm,
        string $eventType,
        string $title
    ): void {
        User::role('admin')->each(function (User $admin) use (
            $seller,
            $farm,
            $eventType,
            $title
        ) {
            if ((int) $admin->id === (int) $seller->id) {
                return;
            }

            $admin->notify(new MarketplaceNotification(
                $eventType,
                $title,
                'Nông trại ' . $farm->name . ' đang chờ kiểm duyệt.',
                '/admin/farms',
                $seller,
                ['farm_id' => $farm->id]
            ));
        });
    }
}
