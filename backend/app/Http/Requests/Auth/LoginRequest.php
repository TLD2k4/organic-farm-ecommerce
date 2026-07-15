<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge([
                'email' => mb_strtolower(trim((string) $this->input('email'))),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'email' => ['bail', 'required', 'string', 'email:rfc', 'max:100'],
            'password' => ['bail', 'required', 'string', 'min:8', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Email không được để trống.',
            'email.string' => 'Email phải là chuỗi ký tự.',
            'email.email' => 'Email không đúng định dạng.',
            'email.max' => 'Email tối đa 100 ký tự.',

            'password.required' => 'Mật khẩu không được để trống.',
            'password.string' => 'Mật khẩu phải là chuỗi ký tự.',
            'password.min' => 'Mật khẩu tối thiểu 8 ký tự.',
            'password.max' => 'Mật khẩu tối đa 255 ký tự.',
        ];
    }
}
