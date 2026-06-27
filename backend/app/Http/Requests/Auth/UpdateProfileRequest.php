<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:30',
            'phone' => 'nullable|digits_between:10,11',
            'avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ];
    }

    public function messages(): array
    {
        return [
            'name.max' => 'Tên tối đa 30 ký tự.',
            'phone.digits_between' => 'Số điện thoại phải từ 10-11 số.',
            'avatar.image' => 'Avatar phải là hình ảnh.',
            'avatar.mimes' => 'Avatar chỉ hỗ trợ jpg, jpeg, png, webp.',
            'avatar.max' => 'Avatar tối đa 2MB.',
        ];
    }
}
