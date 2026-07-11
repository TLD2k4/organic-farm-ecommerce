<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHarvestLotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'harvest_date' => ['sometimes', 'required', 'date', 'before_or_equal:today'],
            'expiry_date' => ['sometimes', 'required', 'date', 'after_or_equal:today'],

            'quantity_imported' => ['sometimes', 'required', 'numeric', 'gt:0'],

            'status' => ['sometimes', 'required', 'integer', 'in:1,2'],

            'note' => ['nullable', 'string'],

            'product_id' => ['prohibited'],
            'product_certificate_id' => ['prohibited'],
            'lot_code' => ['prohibited'],
            'quantity_sold' => ['prohibited'],
            'quantity_remaining' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'harvest_date.date' => 'Ngày thu hoạch không hợp lệ.',
            'harvest_date.before_or_equal' => 'Ngày thu hoạch không được lớn hơn ngày hiện tại.',

            'expiry_date.date' => 'Hạn sử dụng lô không hợp lệ.',
            'expiry_date.after_or_equal' => 'Hạn sử dụng lô phải lớn hơn hoặc bằng ngày hiện tại.',

            'quantity_imported.numeric' => 'Số lượng nhập phải là số.',
            'quantity_imported.gt' => 'Số lượng nhập phải lớn hơn 0.',

            'status.integer' => 'Trạng thái lô không hợp lệ.',
            'status.in' => 'Người bán chỉ được chuyển lô sang đang bán hoặc tạm ẩn.',

            'product_id.prohibited' => 'Không được đổi sản phẩm của lô.',
            'product_certificate_id.prohibited' => 'Không được đổi chứng chỉ của lô.',
            'lot_code.prohibited' => 'Không được đổi mã lô.',
            'quantity_sold.prohibited' => 'Không được sửa số lượng đã bán.',
            'quantity_remaining.prohibited' => 'Không được sửa số lượng còn lại.',
        ];
    }
}