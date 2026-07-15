<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('name')) {
            $data['name'] = preg_replace(
                '/\s+/u',
                ' ',
                trim((string) $this->input('name'))
            );
        }

        if ($this->has('phone')) {
            $phone = trim((string) $this->input('phone', ''));
            $data['phone'] = $phone !== '' ? $phone : null;
        }

        if ($this->has('avatar')) {
            $avatar = trim((string) $this->input('avatar', ''));
            $data['avatar'] = $avatar !== '' ? $avatar : null;
        }

        if ($data !== []) {
            $this->merge($data);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'bail', 'required', 'string', 'min:2', 'max:30'],
            'phone' => ['nullable', 'string', 'regex:/^(0[0-9]{9,10})$/'],
            'avatar' => ['nullable', 'string', 'url:http,https', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên không được để trống.',
            'name.string' => 'Tên phải là chuỗi ký tự.',
            'name.min' => 'Tên phải có ít nhất 2 ký tự.',
            'name.max' => 'Tên tối đa 30 ký tự.',

            'phone.string' => 'Số điện thoại phải là chuỗi ký tự.',
            'phone.regex' => 'Số điện thoại phải bắt đầu bằng số 0 và có 10-11 chữ số.',

            'avatar.string' => 'Đường dẫn avatar phải là chuỗi ký tự.',
            'avatar.url' => 'Avatar phải là một URL HTTP hoặc HTTPS hợp lệ.',
            'avatar.max' => 'Đường dẫn avatar tối đa 255 ký tự.',
        ];
    }
}
