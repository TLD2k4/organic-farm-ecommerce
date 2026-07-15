<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminProductIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'keyword' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'integer', Rule::in([0, 1, 2, 3])],
            'certificate_status' => [
                'nullable',
                'string',
                Rule::in([
                    'pending',
                    'approved',
                    'rejected',
                    'expired',
                    'replaced',
                ]),
            ],
            'farm_id' => ['nullable', 'integer', 'exists:farms,id'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'deleted' => ['nullable', 'integer', Rule::in([0, 1])],
            'limit' => ['nullable', 'integer', 'min:5', 'max:50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'keyword.max' => 'Từ khóa tối đa 100 ký tự.',
            'status.integer' => 'Trạng thái sản phẩm không hợp lệ.',
            'status.in' => 'Trạng thái sản phẩm không hợp lệ.',
            'certificate_status.in' => 'Trạng thái hồ sơ chứng chỉ không hợp lệ.',
            'farm_id.exists' => 'Nông trại không tồn tại.',
            'category_id.exists' => 'Danh mục không tồn tại.',
            'deleted.in' => 'Bộ lọc xóa không hợp lệ.',
            'limit.min' => 'Số dòng mỗi trang tối thiểu là 5.',
            'limit.max' => 'Số dòng mỗi trang tối đa là 50.',
            'page.min' => 'Trang phải lớn hơn hoặc bằng 1.',
        ];
    }
}
