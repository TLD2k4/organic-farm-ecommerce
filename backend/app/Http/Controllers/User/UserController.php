<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateProfileRequest;
use App\Services\User\UserService;
use App\Services\Audit\AuditLogService;
use App\Models\User;
use App\Notifications\MarketplaceNotification;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        private UserService $userService,
        private AuditLogService $auditLogService
    ) {}

    public function profile(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $this->userService->formatUser($request->user()),
        ], 200);
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        $data = $this->userService->updateProfile(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thông tin thành công.',
            'data' => $data,
        ], 200);
    }

    public function index(Request $request)
    {
        $filters = [
            'limit' => max(1, min((int) $request->input('limit', 10), 50)),
            'keyword' => $request->input('keyword'),
            'status' => $request->input('status'),
            'deleted' => $request->input('deleted'),
        ];

        $users = $this->userService->getAll($filters);

        return response()->json([
            'success' => true,
            'data' => collect($users->items())->map(
                fn($u) => $this->userService->formatUser($u)
            ),
            'meta' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ],
        ]);
    }

    public function show($id)
    {
        return response()->json([
            'success' => true,
            'data' => $this->userService->show($id),
        ]);
    }

    public function toggleStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $data = $this->userService->toggleStatus($id);
        $newStatus = (int) $data['status'];

        $this->auditLogService->record(
            $request->user(), 'user', (int) $id,
            $newStatus === 1 ? 'unlock' : 'lock',
            $newStatus === 1 ? 0 : 1,
            $newStatus,
            $validated['reason']
        );

        User::withTrashed()->find($id)?->notify(new MarketplaceNotification(
            $newStatus === 1 ? 'account.unlocked' : 'account.locked',
            $newStatus === 1 ? 'Tài khoản đã được mở khóa' : 'Tài khoản đã bị khóa',
            'Lý do: ' . $validated['reason'],
            '/profile',
            $request->user(),
            ['user_id' => (int) $id]
        ));

        return response()->json([
            'success' => true,
            'message' => $data['message'],
            'data' => $data,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $user = $this->userService->delete($request->user(), $id);

        $this->auditLogService->record(
            $request->user(), 'user', (int) $id, 'soft_delete',
            $user->status, 'deleted', $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => 'Xóa người dùng thành công (xóa mềm).',
            'data' => $this->userService->formatUser($user),
        ]);
    }

    public function forceDestroy(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $user = $this->userService->forceDelete($request->user(), $id);

        $this->auditLogService->record(
            $request->user(), 'user', (int) $id, 'force_delete',
            'deleted', 'purged', $validated['reason'],
            [
                'user_name' => $user->name,
                'user_email' => $user->email,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Xóa vĩnh viễn người dùng thành công.',
            'data' => $this->userService->formatUser($user),
        ]);
    }

    public function restore(Request $request, $id)
    {
        $user = $this->userService->restore($id);

        $this->auditLogService->record(
            $request->user(), 'user', (int) $id, 'restore',
            'deleted', $user->status
        );

        return response()->json([
            'success' => true,
            'message' => 'Khôi phục người dùng thành công.',
            'data' => $this->userService->formatUser($user),
        ]);
    }
}
