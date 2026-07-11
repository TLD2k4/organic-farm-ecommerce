<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreHarvestLotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],

            'lot_code' => ['required', 'string', 'max:10', 'unique:harvest_lots,lot_code'],

            'harvest_date' => ['required', 'date', 'before_or_equal:today'],
            'expiry_date' => ['required', 'date', 'after:harvest_date', 'after_or_equal:today'],

            'quantity_imported' => ['required', 'numeric', 'gt:0'],

            'note' => ['nullable', 'string'],

            'product_certificate_id' => ['prohibited'],
            'quantity_sold' => ['prohibited'],
            'quantity_remaining' => ['prohibited'],
            'status' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'Vui lòng chọn sản phẩm.',
            'product_id.exists' => 'Sản phẩm không tồn tại.',

            'lot_code.required' => 'Mã lô không được để trống.',
            'lot_code.max' => 'Mã lô không được vượt quá 10 ký tự.',
            'lot_code.unique' => 'Mã lô đã tồn tại.',

            'harvest_date.required' => 'Ngày thu hoạch không được để trống.',
            'harvest_date.date' => 'Ngày thu hoạch không hợp lệ.',
            'harvest_date.before_or_equal' => 'Ngày thu hoạch không được lớn hơn ngày hiện tại.',

            'expiry_date.required' => 'Hạn sử dụng lô không được để trống.',
            'expiry_date.date' => 'Hạn sử dụng lô không hợp lệ.',
            'expiry_date.after' => 'Hạn sử dụng lô phải sau ngày thu hoạch.',
            'expiry_date.after_or_equal' => 'Lô đã hết hạn sử dụng, không thể tạo để bán.',

            'quantity_imported.required' => 'Số lượng nhập không được để trống.',
            'quantity_imported.numeric' => 'Số lượng nhập phải là số.',
            'quantity_imported.gt' => 'Số lượng nhập phải lớn hơn 0.',

            'product_certificate_id.prohibited' => 'Không được tự chọn chứng chỉ cho lô.',
            'quantity_sold.prohibited' => 'Không được tự nhập số lượng đã bán.',
            'quantity_remaining.prohibited' => 'Không được tự nhập số lượng còn lại.',
            'status.prohibited' => 'Không được tự thiết lập trạng thái lô.',
        ];
    }
}