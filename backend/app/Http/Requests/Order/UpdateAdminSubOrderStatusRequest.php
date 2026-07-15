<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAdminSubOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'integer',
                'in:1,2,3,4',
            ],
            'reason' => ['required', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Vui lòng chọn trạng thái cần chuyển.',
            'status.integer' => 'Trạng thái không hợp lệ.',
            'status.in' => 'Trạng thái không hợp lệ.',
            'reason.required' => 'Vui lòng nhập lý do cập nhật trạng thái.',
            'reason.max' => 'Lý do không được vượt quá 500 ký tự.',
        ];
    }
}
