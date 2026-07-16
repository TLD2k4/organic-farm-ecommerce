<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $name = preg_replace('/\s+/u', ' ', trim((string) $this->input('name', '')));
        $email = mb_strtolower(trim((string) $this->input('email', '')));
        $phone = trim((string) $this->input('phone', ''));
        $avatar = trim((string) $this->input('avatar', ''));

        $this->merge([
            'name' => $name,
            'email' => $email,
            'phone' => $phone !== '' ? $phone : null,
            'avatar' => $avatar !== '' ? $avatar : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['bail', 'required', 'string', 'min:2', 'max:30'],
            'email' => ['bail', 'required', 'string', 'email:rfc', 'max:100', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'regex:/^(0[0-9]{9,10})$/'],
            'password' => ['bail', 'required', 'string', 'min:8', 'max:255', 'confirmed'],
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

            'email.required' => 'Email không được để trống.',
            'email.string' => 'Email phải là chuỗi ký tự.',
            'email.email' => 'Email không đúng định dạng.',
            'email.unique' => 'Email đã tồn tại.',
            'email.max' => 'Email tối đa 100 ký tự.',

            'phone.string' => 'Số điện thoại phải là chuỗi ký tự.',
            'phone.regex' => 'Số điện thoại phải bắt đầu bằng số 0 và có 10-11 chữ số.',

            'password.required' => 'Mật khẩu không được để trống.',
            'password.string' => 'Mật khẩu phải là chuỗi ký tự.',
            'password.min' => 'Mật khẩu tối thiểu 8 ký tự.',
            'password.max' => 'Mật khẩu tối đa 255 ký tự.',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.',

            'avatar.string' => 'Đường dẫn avatar phải là chuỗi ký tự.',
            'avatar.url' => 'Avatar phải là một URL HTTP hoặc HTTPS hợp lệ.',
            'avatar.max' => 'Đường dẫn avatar tối đa 255 ký tự.',
        ];
    }
}