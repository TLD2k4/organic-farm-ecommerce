<?php

namespace App\Http\Requests\Farm;

use Illuminate\Foundation\Http\FormRequest;

class RejectFarmRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('rejection_reason')) {
            $this->merge([
                'rejection_reason' => preg_replace(
                    '/\s+/u',
                    ' ',
                    trim($this->input('rejection_reason'))
                ),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'rejection_reason' => [
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
            'rejection_reason.required' => 'Vui lòng nhập lý do từ chối.',
            'rejection_reason.string' => 'Lý do từ chối phải là chuỗi ký tự.',
            'rejection_reason.min' => 'Lý do từ chối phải có ít nhất 10 ký tự.',
            'rejection_reason.max' => 'Lý do từ chối tối đa 1000 ký tự.',
        ];
    }
}
