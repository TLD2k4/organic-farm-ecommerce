<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateProfileRequest;
use App\Services\User\UserService;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        private UserService $userService
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

    public function toggleStatus($id)
    {
        $data = $this->userService->toggleStatus($id);

        return response()->json([
            'success' => true,
            'message' => $data['message'],
            'data' => $data,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $this->userService->delete($request->user(), $id);

        return response()->json([
            'success' => true,
            'message' => 'Xóa người dùng thành công (xóa mềm).',
            'data' => $this->userService->formatUser($user),
        ]);
    }

    public function forceDestroy(Request $request, $id)
    {
        $user = $this->userService->forceDelete($request->user(), $id);

        return response()->json([
            'success' => true,
            'message' => 'Xóa vĩnh viễn người dùng thành công.',
            'data' => $this->userService->formatUser($user),
        ]);
    }

    public function restore($id)
    {
        $user = $this->userService->restore($id);

        return response()->json([
            'success' => true,
            'message' => 'Khôi phục người dùng thành công.',
            'data' => $this->userService->formatUser($user),
        ]);
    }
}
