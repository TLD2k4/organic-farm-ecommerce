<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVendorProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['sometimes', 'required', 'integer', 'exists:categories,id'],

            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],

            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0'],

            // Không cho sửa stock trong Product API
            'stock_quantity' => ['prohibited'],

            'unit' => ['sometimes', 'required', 'string', 'max:30'],

            // Ảnh đại diện sản phẩm
            'thumbnail' => ['sometimes', 'required', 'url', 'max:255'],

            // Ảnh thứ 2, 3... chỉ hiện ở chi tiết
            'detail_images' => ['nullable', 'array'],
            'detail_images.*' => ['required', 'url', 'max:255'],

            'is_hot' => ['nullable', 'boolean'],
            'status' => ['nullable', 'integer', 'in:1,3'],
        ];
    }

    public function messages(): array
    {
        return [
            'stock_quantity.prohibited' => 'Không được sửa tồn kho thủ công. Tồn kho được cập nhật từ lô sản phẩm.',

            'thumbnail.required' => 'Ảnh đại diện sản phẩm không được để trống',
            'thumbnail.url' => 'Ảnh đại diện phải là URL hợp lệ',
            'thumbnail.max' => 'Đường dẫn ảnh đại diện không được vượt quá 255 ký tự',

            'detail_images.array' => 'Danh sách ảnh chi tiết không hợp lệ',
            'detail_images.*.url' => 'Ảnh chi tiết phải là URL hợp lệ',
            'detail_images.*.max' => 'Đường dẫn ảnh chi tiết không được vượt quá 255 ký tự',

            'status.integer' => 'Trạng thái sản phẩm không hợp lệ.',
            'status.in' => 'Người bán chỉ được chuyển sản phẩm sang đang bán hoặc tạm ẩn.',
        ];
    }
}