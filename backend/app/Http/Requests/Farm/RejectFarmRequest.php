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
        /*
         * rejection_reason là tên chuẩn. Vẫn nhận reason để không làm hỏng
         * client cũ trong thời gian chuyển đổi.
         */
        $reason = $this->has('rejection_reason')
            ? $this->input('rejection_reason')
            : $this->input('reason');

        if ($reason !== null) {
            $this->merge([
                'rejection_reason' => preg_replace(
                    '/\s+/u',
                    ' ',
                    trim((string) $reason)
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
            'rejection_reason.required' => 'Lý do từ chối không được để trống.',
            'rejection_reason.string' => 'Lý do từ chối phải là chuỗi ký tự.',
            'rejection_reason.min' => 'Lý do từ chối phải có ít nhất 10 ký tự.',
            'rejection_reason.max' => 'Lý do từ chối tối đa 1000 ký tự.',
        ];
    }
}
