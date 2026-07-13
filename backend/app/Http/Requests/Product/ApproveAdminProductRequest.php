<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class ApproveAdminProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('certificate_id') === '') {
            $this->merge([
                'certificate_id' => null,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'certificate_id' => [
                'nullable',
                'integer',
                'exists:product_certificates,id',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'certificate_id.integer' => 'Hồ sơ chứng chỉ không hợp lệ.',
            'certificate_id.exists' => 'Hồ sơ chứng chỉ không tồn tại.',
        ];
    }
}
