<?php

namespace App\Http\Requests\Cart;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
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
            'quantity.required' => 'Vui lòng nhập số lượng.',
            'quantity.numeric' => 'Số lượng phải là số.',
            'quantity.gte' => 'Khối lượng tối thiểu là 0,1 kg.',
            'quantity.decimal' => 'Khối lượng chỉ được có tối đa 2 chữ số thập phân.',
        ];
    }
}
