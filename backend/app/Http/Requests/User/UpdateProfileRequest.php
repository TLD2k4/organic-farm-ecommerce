<?php

namespace App\Http\Requests\User;

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
            'name' => 'sometimes|required|string|max:30',
            'phone' => 'nullable|regex:/^(0[0-9]{9,10})$/',
            'avatar' => ['nullable', 'url', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên không được để trống.',
            'name.max' => 'Tên tối đa 30 ký tự.',

            'phone.regex' => 'Số điện thoại phải bắt đầu bằng số 0 và có 10-11 chữ số.',

            'avatar.url' => 'Avatar phải là một URL hợp lệ.',
            'avatar.max' => 'Đường dẫn avatar tối đa 255 ký tự.',
        ];
    }
}
