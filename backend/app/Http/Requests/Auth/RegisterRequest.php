<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:30',
            'email' => 'required|email|max:100|unique:users,email',
            'phone' => 'nullable|regex:/^(0[0-9]{9,10})$/',
            'password' => 'required|string|min:8|max:255|confirmed',
            'avatar' => ['nullable', 'url', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên không được để trống.',
            'name.max' => 'Tên tối đa 30 ký tự.',

            'email.required' => 'Email không được để trống.',
            'email.email' => 'Email không đúng định dạng.',
            'email.unique' => 'Email đã tồn tại.',
            'email.max' => 'Email tối đa 100 ký tự.',

            'phone.regex' => 'Số điện thoại phải bắt đầu bằng số 0 và có 10-11 chữ số.',

            'password.required' => 'Mật khẩu không được để trống.',
            'password.min' => 'Mật khẩu tối thiểu 8 ký tự.',
            'password.max' => 'Mật khẩu tối đa 255 ký tự.',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.',

            'avatar.url' => 'Avatar phải là một URL hợp lệ.',
            'avatar.max' => 'Đường dẫn avatar tối đa 255 ký tự.',
        ];
    }
}
