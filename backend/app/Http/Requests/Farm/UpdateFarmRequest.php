<?php

namespace App\Http\Requests\Farm;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFarmRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->filled('name')) {
            $data['name'] = preg_replace(
                '/\s+/u',
                ' ',
                trim($this->input('name'))
            );
        }

        if ($this->filled('phone')) {
            $data['phone'] = trim(
                $this->input('phone')
            );
        }

        if ($this->filled('address')) {
            $data['address'] = preg_replace(
                '/\s+/u',
                ' ',
                trim($this->input('address'))
            );
        }

        if ($data !== []) {
            $this->merge($data);
        }
    }

    public function rules(): array
    {
        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
                'max:5000',
            ],

            'logo' => [
                'sometimes',
                'nullable',
                'url',
                'max:255',
            ],

            'cover_image' => [
                'sometimes',
                'nullable',
                'url',
                'max:255',
            ],

            'phone' => [
                'sometimes',
                'nullable',
                'regex:/^(0[0-9]{9,10})$/',
            ],

            'address' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên nông trại không được để trống.',
            'name.string' => 'Tên nông trại phải là chuỗi ký tự.',
            'name.max' => 'Tên nông trại tối đa 100 ký tự.',

            'description.string' => 'Mô tả phải là chuỗi ký tự.',
            'description.max' => 'Mô tả tối đa 5000 ký tự.',

            'logo.url' => 'Logo phải là một URL hợp lệ.',
            'logo.max' => 'Đường dẫn logo tối đa 255 ký tự.',

            'cover_image.url' => 'Ảnh bìa phải là một URL hợp lệ.',
            'cover_image.max' => 'Đường dẫn ảnh bìa tối đa 255 ký tự.',

            'phone.regex' => 'Số điện thoại phải bắt đầu bằng 0 và có 10-11 chữ số.',

            'address.required' => 'Địa chỉ nông trại không được để trống.',
            'address.string' => 'Địa chỉ phải là chuỗi ký tự.',
            'address.max' => 'Địa chỉ tối đa 255 ký tự.',
        ];
    }
}
