<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Services\Auth\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $authService
    ) {}

    public function login(LoginRequest $request)
    {
        try {

            $data = $this->authService->login(
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Đăng nhập thành công.',
                'data' => $data,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'error' => 'Đã xảy ra lỗi hệ thống.',
            ], 500);
        }
    }

    public function register(RegisterRequest $request)
    {
        try {

            $data = $this->authService->register(
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Đăng ký thành công.',
                'data' => $data,
            ], 201);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'error' => 'Đã xảy ra lỗi hệ thống.',
            ], 500);
        }
    }

    public function profile(Request $request)
    {
        try {

            return response()->json([
                'success' => true,
                'data' => $this->authService->formatUser($request->user()),
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'error' => 'Đã xảy ra lỗi hệ thống.'
            ], 500);
        }
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        try {

            $data = $this->authService->updateProfile(
                $request->user(),
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật thông tin thành công.',
                'data' => $data,
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'error' => 'Đã xảy ra lỗi hệ thống.'
            ], 500);
        }
    }	

    public function changePassword(ChangePasswordRequest $request)
    {
        try {

            $this->authService->changePassword(
                $request->user(),
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Đổi mật khẩu thành công.',
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'error' => 'Đã xảy ra lỗi hệ thống.'
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {

            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Đăng xuất thành công.',
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'error' => 'Đã xảy ra lỗi hệ thống.',
            ], 500);
        }
    }
}