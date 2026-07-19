<?php

namespace App\Http\Requests\Cart;

use Illuminate\Foundation\Http\FormRequest;

class AddCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],

            'quantity' => [
                'required',
                'numeric',
                'gte:0.1',
                'decimal:0,2',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'Vui lòng chọn sản phẩm.',
            'product_id.integer' => 'Sản phẩm không hợp lệ.',
            'product_id.exists' => 'Sản phẩm không tồn tại.',

            'quantity.required' => 'Vui lòng nhập số lượng.',
            'quantity.numeric' => 'Số lượng phải là số.',
            'quantity.gte' => 'Khối lượng tối thiểu là 0,1 kg.',
            'quantity.decimal' => 'Khối lượng chỉ được có tối đa 2 chữ số thập phân.',
        ];
    }
}
