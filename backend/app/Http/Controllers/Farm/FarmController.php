<?php

namespace App\Http\Controllers\Farm;

use App\Http\Controllers\Controller;
use App\Http\Requests\Farm\AdminFarmIndexRequest;
use App\Http\Requests\Farm\RegisterFarmRequest;
use App\Http\Requests\Farm\RejectFarmRequest;
use App\Http\Requests\Farm\UpdateFarmRequest;
use App\Services\Farm\FarmService;
use Illuminate\Http\Request;

class FarmController extends Controller
{
    public function __construct(
        private FarmService $farmService
    ) {}

    // =====================================================
    // PUBLIC
    // =====================================================

    public function index(
        Request $request
    ) {
        $filters = [
            'limit' => max(
                1,
                min(
                    (int) $request->input(
                        'limit',
                        12
                    ),
                    50
                )
            ),

            'keyword' =>
            $request->input('keyword'),
        ];

        $farms = $this->farmService
            ->getAll($filters);

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

    public function show(
        string $slug
    ) {
        return response()->json([
            'success' => true,

            'data' => $this->farmService
                ->getBySlug($slug),
        ]);
    }

    // =====================================================
    // OWNER
    // =====================================================

    public function register(
        RegisterFarmRequest $request
    ) {
        $farm = $this->farmService
            ->register(
                $request->user(),
                $request->validated()
            );

        $isAdmin = $request
            ->user()
            ->hasRole('admin');

        return response()->json([
            'success' => true,

            'message' => $isAdmin
                ? 'Đăng ký nông trại thành công. Nông trại đã được kích hoạt.'
                : 'Đăng ký nông trại thành công. Vui lòng chờ quản trị viên xét duyệt.',

            'data' => $farm,
        ], 201);
    }

    public function myFarm(
        Request $request
    ) {
        return response()->json([
            'success' => true,

            'data' => $this->farmService
                ->getMyFarm(
                    $request->user()
                ),
        ]);
    }

    public function update(
        UpdateFarmRequest $request,
        $id
    ) {
        $farm = $this->farmService
            ->updateOwnedFarm(
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

    public function resubmit(
        Request $request,
        $id
    ) {
        $farm = $this->farmService
            ->resubmit(
                $request->user(),
                (int) $id
            );

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi lại hồ sơ nông trại để chờ duyệt.',
            'data' => $farm,
        ]);
    }

    public function ownerForceDestroy(
        Request $request,
        $id
    ) {
        $farm = $this->farmService
            ->ownerForceDelete(
                $request->user(),
                (int) $id
            );

        return response()->json([
            'success' => true,

            'message' =>
            'Xóa vĩnh viễn hồ sơ nông trại thành công.',

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

    public function adminIndex(
        AdminFarmIndexRequest $request
    ) {
        $filters = $request->validated();

        $filters['limit'] =
            $filters['limit'] ?? 10;

        $farms = $this->farmService
            ->adminGetAll($filters);

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

    public function adminShow(
        $id
    ) {
        return response()->json([
            'success' => true,

            'data' => $this->farmService
                ->adminGetById(
                    (int) $id
                ),
        ]);
    }

    public function approve(
        Request $request,
        $id
    ) {
        $farm = $this->farmService
            ->approve(
                $request->user(),
                (int) $id
            );

        return response()->json([
            'success' => true,
            'message' => 'Duyệt nông trại thành công.',
            'data' => $farm,
        ]);
    }

    public function reject(
        RejectFarmRequest $request,
        $id
    ) {
        $farm = $this->farmService
            ->reject(
                (int) $id,
                $request->validated(
                    'rejection_reason'
                )
            );

        return response()->json([
            'success' => true,
            'message' => 'Từ chối nông trại thành công.',
            'data' => $farm,
        ]);
    }

    public function suspend(
        $id
    ) {
        $farm = $this->farmService
            ->suspend(
                (int) $id
            );

        return response()->json([
            'success' => true,
            'message' => 'Đình chỉ nông trại thành công.',
            'data' => $farm,
        ]);
    }

    public function reopen(
        $id
    ) {
        $farm = $this->farmService
            ->reopen(
                (int) $id
            );

        return response()->json([
            'success' => true,
            'message' => 'Mở lại nông trại thành công.',
            'data' => $farm,
        ]);
    }

    public function adminDestroy(
        $id
    ) {
        $farm = $this->farmService
            ->adminSoftDelete(
                (int) $id
            );

        return response()->json([
            'success' => true,
            'message' => 'Xóa mềm nông trại thành công.',
            'data' => $farm,
        ]);
    }

    public function restore(
        $id
    ) {
        $farm = $this->farmService
            ->restore(
                (int) $id
            );

        return response()->json([
            'success' => true,
            'message' => 'Khôi phục nông trại thành công.',
            'data' => $farm,
        ]);
    }

    public function forceDestroy(
        $id
    ) {
        $farm = $this->farmService
            ->forceDelete(
                (int) $id
            );

        return response()->json([
            'success' => true,

            'message' =>
            'Xóa vĩnh viễn nông trại thành công.',

            'data' => [
                'id' => $farm->id,
                'name' => $farm->name,
                'seller_id' => $farm->seller_id,
            ],
        ]);
    }
}
