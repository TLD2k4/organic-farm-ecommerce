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
            'current_password' => ['bail', 'required', 'string', 'min:8', 'max:255'],
            'password' => [
                'bail',
                'required',
                'string',
                'min:8',
                'max:255',
                'different:current_password',
                'confirmed',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.required' => 'Mật khẩu hiện tại không được để trống.',
            'current_password.string' => 'Mật khẩu hiện tại phải là chuỗi ký tự.',
            'current_password.min' => 'Mật khẩu hiện tại tối thiểu 8 ký tự.',
            'current_password.max' => 'Mật khẩu hiện tại tối đa 255 ký tự.',

            'password.required' => 'Mật khẩu mới không được để trống.',
            'password.string' => 'Mật khẩu mới phải là chuỗi ký tự.',
            'password.min' => 'Mật khẩu mới tối thiểu 8 ký tự.',
            'password.max' => 'Mật khẩu mới tối đa 255 ký tự.',
            'password.different' => 'Mật khẩu mới phải khác mật khẩu hiện tại.',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.',
        ];
    }
}
