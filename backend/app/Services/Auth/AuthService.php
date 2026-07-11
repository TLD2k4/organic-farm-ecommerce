<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{

    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => $data['password'], // nếu User có cast hashed thì ok
            'avatar' => $data['avatar'] ?? null,
            'status' => 1,
        ]);

        $user->assignRole('customer');

        $token = $user->createToken('api-token')->plainTextToken;

        return [
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->formatUser($user),
        ];
    }

    public function login(array $data): array
    {
        $key = Str::lower($data['email']) . '|' . request()->ip();

        // check bị khóa chưa
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);

            throw ValidationException::withMessages([
                'email' => ["Bạn thử quá nhiều lần. Vui lòng đợi {$seconds} giây."],
            ]);
        }

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {

            RateLimiter::hit($key, 60); // tăng count + block 60s

            throw ValidationException::withMessages([
                'email' => ['Thông tin đăng nhập không chính xác.'],
            ]);
        }

        if ((int) $user->status !== 1) {
            throw ValidationException::withMessages([
                'email' => ['Tài khoản đã bị khóa.'],
            ]);
        }

        // login đúng thì reset counter
        RateLimiter::clear($key);

        $token = $user->createToken('api-token')->plainTextToken;

        return [
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->formatUser($user),
        ];
    }

    public function formatUser(User $user): array
    {
        $user->loadMissing([
            'farm',
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
        ];
    }

    public function changePassword(User $user, array $data): void
    {
        if (!Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Mật khẩu hiện tại không đúng.'],
            ]);
        }

        if (Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Mật khẩu mới phải khác mật khẩu hiện tại.'],
            ]);
        }

        $user->password = $data['password']; // nhờ cast hashed
        $user->save();
        $user->tokens()->delete();
    }
}
