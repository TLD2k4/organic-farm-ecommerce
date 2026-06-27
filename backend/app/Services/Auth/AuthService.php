<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(array $data): array
    {
        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email hoặc mật khẩu không đúng.'],
            ]);
        }

        if ((int) $user->status !== 1) {
            throw ValidationException::withMessages([
                'email' => ['Tài khoản đã bị khóa.'],
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return [
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->formatUser($user),
        ];
    }

    public function register(array $data): array
    {
        $avatarPath = null;

        if (isset($data['avatar'])) {
            $avatarPath = $data['avatar']->store('avatars', 'public');
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' =>  $data['phone'] ?? null,
            'password' => $data['password'],
            'avatar' => $avatarPath,
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

    public function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'status' => $user->status,
            'roles' => $user->getRoleNames(),
        ];
    }

    public function updateProfile(User $user, array $data): array
    {
        if (isset($data['avatar'])) {

            $avatarPath = $data['avatar']->store('avatars', 'public');
            $user->avatar = $avatarPath;
        }

        if (isset($data['name'])) {
            $user->name = $data['name'];
        }

        if (isset($data['phone'])) {
            $user->phone = $data['phone'];
        }

        $user->save();

        return $this->formatUser($user);
    }
    public function changePassword(User $user, array $data): void
    {
        if (!Hash::check($data['current_password'], $user->password)) {
        throw ValidationException::withMessages([
            'current_password' => ['Mật khẩu hiện tại không đúng.'],
        ]);
        }

        $user->password = $data['password']; // nhờ cast hashed
        $user->save();
    }
}