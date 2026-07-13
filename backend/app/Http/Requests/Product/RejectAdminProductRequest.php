<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class RejectAdminProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('rejection_reason')) {
            $this->merge([
                'rejection_reason' => preg_replace(
                    '/\s+/u',
                    ' ',
                    trim((string) $this->input('rejection_reason'))
                ),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'rejection_reason' => [
                'bail',
                'required',
                'string',
                'min:10',
                'max:1000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'rejection_reason.required' => 'Lý do từ chối sản phẩm không được để trống.',
            'rejection_reason.min' => 'Lý do từ chối sản phẩm phải có ít nhất 10 ký tự.',
            'rejection_reason.max' => 'Lý do từ chối sản phẩm tối đa 1000 ký tự.',
        ];
    }
}
