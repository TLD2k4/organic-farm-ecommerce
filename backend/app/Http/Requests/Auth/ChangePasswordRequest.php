<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password' => 'required',
            'password' => 'required|min:8|confirmed',
        ];
    }
    
    public function messages(): array
    {
        return [
            'current_password.required' => 'Mật khẩu hiện tại không được để trống.',
            'password.required' => 'Mật khẩu mới không được để trống.',
            'password.min' => 'Mật khẩu mới tối thiểu 8 ký tự.',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.',
        ];
    }
}
