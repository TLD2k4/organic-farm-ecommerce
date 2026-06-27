<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

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
            'phone' => 'nullable|digits_between:10,11',
            'password' => 'required|min:8|confirmed',
            'avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
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

            'phone.digits_between' => 'Số điện thoại phải từ 10-11 số.',

            'password.required' => 'Mật khẩu không được để trống.',
            'password.min' => 'Mật khẩu tối thiểu 8 ký tự.',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.',

            'avatar.image' => 'Avatar phải là hình ảnh.',
            'avatar.mimes' => 'Avatar chỉ hỗ trợ jpg, jpeg, png, webp.',
            'avatar.max' => 'Avatar tối đa 2MB.',
        ];
    }
}