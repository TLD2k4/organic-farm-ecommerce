<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreVendorProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],

            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],

            'price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0', 'lte:price'],

            // Không cho seller nhập stock tay
            'stock_quantity' => ['prohibited'],

            'unit' => ['required', 'string', 'in:kg'],

            // Ảnh đầu tiên: lưu vào products.thumbnail
            'thumbnail' => ['required', 'url', 'max:255'],

            // Ảnh thứ 2, 3...: lưu vào product_images
            'detail_images' => ['nullable', 'array'],
            'detail_images.*' => ['required', 'url', 'max:255'],

            'is_hot' => ['nullable', 'boolean'],

            // Hồ sơ chứng chỉ sản phẩm
            'certification_id' => 'required|integer|exists:certifications,id',
            'certificate_number' => 'required|string|max:100|unique:product_certificates,certificate_number',
            'certificate_file' => 'required|string|max:255',
            'issued_date' => 'required|date',
            'expiry_date' => 'required|date|after:issued_date',

            // Seller không được tự set trạng thái duyệt
            'status' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_id.required' => 'Danh mục sản phẩm không được để trống',
            'category_id.exists' => 'Danh mục sản phẩm không tồn tại',

            'name.required' => 'Tên sản phẩm không được để trống',
            'name.max' => 'Tên sản phẩm không được vượt quá 150 ký tự',

            'price.required' => 'Giá sản phẩm không được để trống',
            'price.numeric' => 'Giá sản phẩm phải là số',
            'price.min' => 'Giá sản phẩm phải lớn hơn hoặc bằng 0',

            'sale_price.numeric' => 'Giá khuyến mãi phải là số',
            'sale_price.min' => 'Giá khuyến mãi phải lớn hơn hoặc bằng 0',
            'sale_price.lte' => 'Giá khuyến mãi không được lớn hơn giá gốc',

            'stock_quantity.prohibited' => 'Không được nhập tồn kho thủ công. Tồn kho được cập nhật từ lô sản phẩm.',

            'unit.required' => 'Đơn vị tính không được để trống',

            'thumbnail.required' => 'Ảnh đại diện sản phẩm không được để trống',
            'thumbnail.url' => 'Ảnh đại diện phải là URL hợp lệ',
            'thumbnail.max' => 'Đường dẫn ảnh đại diện không được vượt quá 255 ký tự',

            'detail_images.array' => 'Danh sách ảnh chi tiết không hợp lệ',
            'detail_images.*.url' => 'Ảnh chi tiết phải là URL hợp lệ',
            'detail_images.*.max' => 'Đường dẫn ảnh chi tiết không được vượt quá 255 ký tự',

            'status.prohibited' => 'Người bán không được tự thiết lập trạng thái sản phẩm.',

            'certification_id.required' => 'Vui lòng chọn danh mục chứng chỉ.',
            'certification_id.exists' => 'Danh mục chứng chỉ không tồn tại.',

            'certificate_number.required' => 'Số chứng chỉ không được để trống.',
            'certificate_number.unique' => 'Số chứng chỉ đã tồn tại.',

            'certificate_file.required' => 'File chứng chỉ không được để trống.',

            'issued_date.required' => 'Ngày cấp chứng chỉ không được để trống.',
            'issued_date.date' => 'Ngày cấp chứng chỉ không hợp lệ.',

            'expiry_date.required' => 'Ngày hết hạn chứng chỉ không được để trống.',
            'expiry_date.date' => 'Ngày hết hạn chứng chỉ không hợp lệ.',
            'expiry_date.after' => 'Ngày hết hạn phải sau ngày cấp.',
        ];
    }
}