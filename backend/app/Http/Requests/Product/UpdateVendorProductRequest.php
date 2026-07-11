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

            // Không cho seller sửa tồn kho tay
            'stock_quantity' => ['prohibited'],

            'unit' => ['required', 'string', 'in:kg'],

            'thumbnail' => ['sometimes', 'required', 'url', 'max:255'],

            'detail_images' => ['nullable', 'array'],
            'detail_images.*' => ['required', 'url', 'max:255'],

            'is_hot' => ['nullable', 'boolean'],

            // Không cho đổi trạng thái trong API update
            'status' => ['prohibited'],

            // Không cho sửa / đổi chứng chỉ trong API update sản phẩm
            'product_certificate_id' => ['prohibited'],
            'certification_id' => ['prohibited'],
            'certificate_number' => ['prohibited'],
            'certificate_file' => ['prohibited'],
            'issued_date' => ['prohibited'],
            'expiry_date' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_id.required' => 'Danh mục sản phẩm không được để trống.',
            'category_id.exists' => 'Danh mục sản phẩm không tồn tại.',

            'name.required' => 'Tên sản phẩm không được để trống.',
            'name.max' => 'Tên sản phẩm không được vượt quá 150 ký tự.',

            'price.required' => 'Giá sản phẩm không được để trống.',
            'price.numeric' => 'Giá sản phẩm phải là số.',
            'price.min' => 'Giá sản phẩm phải lớn hơn hoặc bằng 0.',

            'sale_price.numeric' => 'Giá khuyến mãi phải là số.',
            'sale_price.min' => 'Giá khuyến mãi phải lớn hơn hoặc bằng 0.',

            'stock_quantity.prohibited' => 'Không được sửa tồn kho thủ công. Tồn kho được cập nhật từ lô sản phẩm.',

            'unit.required' => 'Đơn vị tính không được để trống.',

            'thumbnail.required' => 'Ảnh đại diện sản phẩm không được để trống.',
            'thumbnail.url' => 'Ảnh đại diện phải là URL hợp lệ.',
            'thumbnail.max' => 'Đường dẫn ảnh đại diện không được vượt quá 255 ký tự.',

            'detail_images.array' => 'Danh sách ảnh chi tiết không hợp lệ.',
            'detail_images.*.url' => 'Ảnh chi tiết phải là URL hợp lệ.',
            'detail_images.*.max' => 'Đường dẫn ảnh chi tiết không được vượt quá 255 ký tự.',

            'status.prohibited' => 'Không được tự thiết lập trạng thái sản phẩm khi cập nhật.',

            'product_certificate_id.prohibited' => 'Không được sửa chứng chỉ trong form cập nhật sản phẩm.',
            'certification_id.prohibited' => 'Không được đổi loại chứng chỉ. Muốn đổi chứng chỉ phải tạo sản phẩm mới.',
            'certificate_number.prohibited' => 'Không được sửa số chứng chỉ trong form cập nhật sản phẩm.',
            'certificate_file.prohibited' => 'Không được sửa file chứng chỉ trong form cập nhật sản phẩm.',
            'issued_date.prohibited' => 'Không được sửa ngày cấp chứng chỉ trong form cập nhật sản phẩm.',
            'expiry_date.prohibited' => 'Không được sửa ngày hết hạn chứng chỉ trong form cập nhật sản phẩm.',
        ];
    }
}