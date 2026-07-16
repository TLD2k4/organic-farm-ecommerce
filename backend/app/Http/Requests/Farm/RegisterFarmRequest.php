<?php

namespace App\Http\Requests\Farm;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\SellerPolicy;

class RegisterFarmRequest extends FormRequest
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
                trim((string) $this->input('name'))
            );
        }

        if ($this->filled('phone')) {
            $data['phone'] = trim(
                (string) $this->input('phone')
            );
        }

        if ($this->filled('address')) {
            $data['address'] = preg_replace(
                '/\s+/u',
                ' ',
                trim((string) $this->input('address'))
            );
        }

        if ($this->filled('policy_version')) {
            $data['policy_version'] = trim(
                (string) $this->input('policy_version')
            );
        }

        if ($data !== []) {
            $this->merge($data);
        }
    }

    public function rules(): array
    {
        $currentPolicy = SellerPolicy::current();

        return [
            'name' => [
                'bail',
                'required',
                'string',
                'max:100',
            ],

            'description' => [
                'nullable',
                'string',
                'max:5000',
            ],

            'logo' => [
                'nullable',
                'url',
                'max:255',
            ],

            'cover_image' => [
                'nullable',
                'url',
                'max:255',
            ],

            'phone' => [
                'nullable',
                'regex:/^(0[0-9]{9,10})$/',
            ],

            'address' => [
                'bail',
                'required',
                'string',
                'max:255',
            ],

            /*
             * Không tin checkbox ở frontend. Request đăng ký chỉ hợp lệ
             * khi backend nhận được xác nhận và đúng policy version hiện tại.
             */
            'policy_accepted' => [
                'bail',
                'required',
                'accepted',
            ],

            'policy_version' => [
                'bail',
                'required',
                'string',
                'max:50',
                Rule::in([
                    (string) ($currentPolicy?->version ?? config('seller_policy.version')),
                ]),
            ],
            'seller_policy_id' => [
                Rule::requiredIf((bool) $currentPolicy),
                'nullable',
                'integer',
                Rule::in(array_filter([$currentPolicy?->id])),
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

            'policy_accepted.required' =>
            'Bạn phải chấp thuận chính sách người bán trước khi đăng ký.',
            'policy_accepted.accepted' =>
            'Bạn phải chấp thuận chính sách người bán trước khi đăng ký.',

            'policy_version.required' =>
            'Không xác định được phiên bản chính sách người bán.',
            'policy_version.in' =>
            'Chính sách người bán đã được cập nhật. Vui lòng tải lại trang và đọc phiên bản mới.',
        ];
    }
}
