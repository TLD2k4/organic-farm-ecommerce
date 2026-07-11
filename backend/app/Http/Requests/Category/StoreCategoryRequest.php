<?php

namespace App\Http\Requests\Category;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('name')) {

            $name = preg_replace('/\s+/u', ' ', trim($this->name));

            $this->merge([
                'name' => Str::title(
                    mb_strtolower($name)
                ),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'parent_id' => 'nullable|exists:categories,id',

            'name' => 'required|string|max:50|unique:categories,name',

            'description' => 'nullable|string|max:1000',

            'image' => 'nullable|url|max:255',

            'status' => 'nullable|in:0,1',
        ];
    }

    public function messages(): array
    {
        return [
            'parent_id.exists' => 'Danh mục cha không tồn tại.',

            'name.required' => 'Tên danh mục không được để trống.',
            'name.string' => 'Tên danh mục phải là chuỗi ký tự.',
            'name.max' => 'Tên danh mục tối đa 50 ký tự.',
            'name.unique' => 'Tên danh mục đã tồn tại.',

            'description.string' => 'Mô tả phải là chuỗi ký tự.',
            'description.max' => 'Mô tả tối đa 1000 ký tự.',

            'image.url' => 'Ảnh không đúng định dạng URL.',
            'image.max' => 'Đường dẫn ảnh tối đa 255 ký tự.',

            'status.in' => 'Trạng thái chỉ được là 0 (ẩn) hoặc 1 (hiển thị).',
        ];
    }
}
