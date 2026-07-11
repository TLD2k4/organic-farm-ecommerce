<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSellerOrderStatusRequest extends FormRequest
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

            'seller_note' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Vui lòng chọn trạng thái đơn hàng.',
            'status.integer' => 'Trạng thái đơn hàng không hợp lệ.',
            'status.in' => 'Trạng thái đơn hàng không hợp lệ.',

            'seller_note.string' => 'Ghi chú phải là chuỗi ký tự.',
            'seller_note.max' => 'Ghi chú không được vượt quá 255 ký tự.',
        ];
    }
}