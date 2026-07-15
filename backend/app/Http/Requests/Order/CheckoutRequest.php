<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'address_id' => [
                'required',
                'integer',
                'exists:addresses,id',
            ],

            'payment_method' => [
                'required',
                'string',
                'in:COD,MOMO',
            ],
            'cart_item_ids' => ['required', 'array', 'min:1'],
            'cart_item_ids.*' => ['required', 'integer', 'distinct', 'exists:cart_items,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'address_id.required' => 'Vui lòng chọn địa chỉ nhận hàng.',
            'address_id.integer' => 'Địa chỉ không hợp lệ.',
            'address_id.exists' => 'Địa chỉ không tồn tại.',

            'payment_method.required' => 'Vui lòng chọn phương thức thanh toán.',
            'payment_method.in' => 'Phương thức thanh toán không hợp lệ.',
            'cart_item_ids.required' => 'Vui lòng chọn ít nhất một sản phẩm để thanh toán.',
        ];
    }
}
