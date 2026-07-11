<?php

namespace App\Http\Requests\Address;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'receiver_name' => ['sometimes', 'required', 'string', 'max:50'],
            'phone' => ['sometimes', 'required', 'regex:/^(0[0-9]{9,10})$/'],
            'address_line' => ['sometimes', 'required', 'string', 'max:100'],
            'ward' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'receiver_name.required' => 'Vui lòng nhập tên người nhận.',
            'receiver_name.max' => 'Tên người nhận tối đa 50 ký tự.',

            'phone.required' => 'Vui lòng nhập số điện thoại.',
            'phone.regex' => 'Số điện thoại phải bắt đầu bằng số 0 và có 10-11 chữ số.',

            'address_line.required' => 'Vui lòng nhập địa chỉ chi tiết.',
            'address_line.max' => 'Địa chỉ chi tiết tối đa 100 ký tự.',
        ];
    }
}