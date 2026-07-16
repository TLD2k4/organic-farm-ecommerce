<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Validation\ValidationException;


class UserService
{
    public function updateProfile(User $user, array $data): array
    {
        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }

        if (array_key_exists('phone', $data)) {
            $user->phone = $data['phone'] ?: null;
        }

        if (array_key_exists('avatar', $data)) {
            $user->avatar = $data['avatar'] ?: null;
        }

        $user->save();

        return $this->formatUser($user->fresh());
    }

    public function formatUser(User $user): array
    {
        $user->loadMissing([
            'farm' => fn ($query) => $query->withTrashed(),
            'roles',
        ]);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'status' => $user->status,

            'roles' =>
            $user->getRoleNames(),

            'farm' => $user->farm
                ? [
                    'id' =>
                    $user->farm->id,

                    'name' =>
                    $user->farm->name,

                    'slug' =>
                    $user->farm->slug,

                    'logo' =>
                    $user->farm->logo,

                    'cover_image' =>
                    $user->farm->cover_image,

                    'status' =>
                    $user->farm->status,

                    'rejection_reason' =>
                    $user->farm
                        ->rejection_reason,

                    'approved_by' =>
                    $user->farm
                        ->approved_by,

                    'approved_at' =>
                    $user->farm
                        ->approved_at,

                    'created_at' =>
                    $user->farm
                        ->created_at,

                    'updated_at' =>
                    $user->farm
                        ->updated_at,

                    'deleted_at' =>
                    $user->farm
                        ->deleted_at,
                ]
                : null,

            'created_at' =>
            $user->created_at,

            'updated_at' =>
            $user->updated_at,

            'deleted_at' =>
            $user->deleted_at,
        ];
    }

    public function getAll(array $filters)
    {
        return User::withTrashed()
            ->with(['roles', 'farm'])

            ->when(
                !empty($filters['keyword']),
                function ($query) use ($filters) {
                    $keyword = $filters['keyword'];

                    $query->where(function ($q) use ($keyword) {
                        $q->where('name', 'like', "%{$keyword}%")
                            ->orWhere('email', 'like', "%{$keyword}%");
                    });
                }
            )

            ->when(
                $filters['status'] !== null &&
                    $filters['status'] !== '',
                function ($query) use ($filters) {
                    $query->where('status', $filters['status']);
                }
            )

            ->when(
                $filters['deleted'] !== null &&
                    $filters['deleted'] !== '',
                function ($query) use ($filters) {
                    if ($filters['deleted'] == 1) {
                        $query->onlyTrashed();
                    } else {
                        $query->withoutTrashed();
                    }
                }
            )

            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($filters['limit']);
    }

    public function show($id): array
    {
        $user = User::withTrashed()
            ->with(['roles', 'farm'])
            ->findOrFail($id);

        return $this->formatUser($user);
    }

    public function toggleStatus($id)
    {
        $user = User::withTrashed()
            ->with('farm')
            ->findOrFail($id);

        if ($user->trashed()) {
            throw ValidationException::withMessages([
                'user' => [
                    'User đã bị xóa. Vui lòng khôi phục trước khi thao tác.',
                ],
            ]);
        }

        if ((int) $user->id === (int) request()->user()?->id) {
            throw ValidationException::withMessages([
                'user' => [
                    'Không thể tự khóa tài khoản của chính mình.',
                ],
            ]);
        }

        if ($user->hasRole('admin')) {
            throw ValidationException::withMessages([
                'user' => [
                    'Không được khóa tài khoản admin khác.',
                ],
            ]);
        }

        /*
     * Đang chuẩn bị khóa User.
     *
     * Nếu Farm còn active thì phải đình chỉ Farm trước.
     */
        if (
            (int) $user->status === 1 &&
            $user->farm &&
            !$user->farm->trashed() &&
            (int) $user->farm->status === 1
        ) {
            throw ValidationException::withMessages([
                'user' => [
                    'Tài khoản đang sở hữu nông trại hoạt động. Vui lòng đình chỉ nông trại trước khi khóa tài khoản.',
                ],
            ]);
        }

        $user->status = (int) $user->status === 1
            ? 0
            : 1;

        $user->save();

        /*
     * Khóa tài khoản thì thu hồi tất cả token.
     */
        if ((int) $user->status === 0) {
            $user->tokens()->delete();
        }

        return [
            'id' => $user->id,
            'status' => $user->status,

            'message' => (int) $user->status === 1
                ? 'Đã mở khóa tài khoản.'
                : 'Đã khóa tài khoản.',
        ];
    }

    public function delete(User $authUser, $id)
    {
        $user = User::withTrashed()
            ->with('farm')
            ->findOrFail($id);

        if ($user->trashed()) {
            throw ValidationException::withMessages([
                'user' => [
                    'User đã bị xóa.',
                ],
            ]);
        }

        if ((int) $user->id === (int) $authUser->id) {
            throw ValidationException::withMessages([
                'user' => [
                    'Không thể tự xóa tài khoản của chính mình.',
                ],
            ]);
        }

        if ($user->hasRole('admin')) {
            throw ValidationException::withMessages([
                'user' => [
                    'Không được xóa tài khoản admin.',
                ],
            ]);
        }

        /*
     * Quan hệ farm có withTrashed(),
     * nên Farm đã xóa mềm vẫn được tính là còn tồn tại.
     */
        if ($user->farm) {
            throw ValidationException::withMessages([
                'user' => [
                    'Không thể xóa tài khoản vì người dùng vẫn còn nông trại. Vui lòng xử lý nông trại trước.',
                ],
            ]);
        }

        $user->tokens()->delete();
        $user->delete();

        return $user;
    }

    public function forceDelete(User $authUser, $id)
    {
        $user = User::withTrashed()->findOrFail($id);

        if ($user->id === $authUser->id) {
            throw ValidationException::withMessages([
                'user' => ['Không thể tự xóa vĩnh viễn tài khoản của chính mình.'],
            ]);
        }

        if ($user->hasRole('admin')) {
            throw ValidationException::withMessages([
                'user' => ['Không được xóa tài khoản admin.'],
            ]);
        }

        $user->loadMissing('farm');

        if (
            $user->farm ||
            $user->orders()->withTrashed()->exists()
        ) {
            throw ValidationException::withMessages([
                'user' => [
                    'Không thể xóa vì user vẫn còn dữ liệu liên quan.'
                ],
            ]);
        }

        $user->tokens()->delete();
        $user->forceDelete();

        return $user; // trả về model đã xóa vĩnh viễn
    }

    public function restore($id)
    {
        $user = User::withTrashed()->findOrFail($id);

        if (!$user->trashed()) {
            throw ValidationException::withMessages([
                'user' => ['User chưa bị xóa.'],
            ]);
        }

        $user->restore();

        return $user; // trả về model đã khôi phục
    }
}
