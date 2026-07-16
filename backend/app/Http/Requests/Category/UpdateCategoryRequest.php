<?php

namespace App\Http\Requests\Category;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('name')) {
            $name = preg_replace('/\s+/u', ' ', trim((string) $this->input('name')));
            $data['name'] = Str::title(mb_strtolower($name));
        }

        if ($this->has('description')) {
            $description = trim((string) $this->input('description', ''));
            $data['description'] = $description !== '' ? $description : null;
        }

        if ($this->has('image')) {
            $image = trim((string) $this->input('image', ''));
            $data['image'] = $image !== '' ? $image : null;
        }

        if ($this->input('parent_id') === '') {
            $data['parent_id'] = null;
        }

        if ($data !== []) {
            $this->merge($data);
        }
    }

    public function rules(): array
    {
        $categoryId = (int) $this->route('id');

        return [
            'parent_id' => [
                'nullable',
                'integer',
                'exists:categories,id',
                Rule::notIn([$categoryId]),
            ],
            'name' => [
                'sometimes',
                'bail',
                'required',
                'string',
                'min:2',
                'max:50',
                Rule::unique('categories', 'name')->ignore($categoryId),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'string', 'url:http,https', 'max:255'],
            'status' => ['nullable', 'integer', 'in:0,1'],
        ];
    }

    public function messages(): array
    {
        return [
            'parent_id.integer' => 'Danh mục cha không hợp lệ.',
            'parent_id.exists' => 'Danh mục cha không tồn tại.',
            'parent_id.not_in' => 'Danh mục không thể chọn chính nó làm danh mục cha.',

            'name.required' => 'Tên danh mục không được để trống.',
            'name.string' => 'Tên danh mục phải là chuỗi ký tự.',
            'name.min' => 'Tên danh mục phải có ít nhất 2 ký tự.',
            'name.max' => 'Tên danh mục tối đa 50 ký tự.',
            'name.unique' => 'Tên danh mục đã tồn tại.',

            'description.string' => 'Mô tả phải là chuỗi ký tự.',
            'description.max' => 'Mô tả tối đa 1000 ký tự.',

            'image.string' => 'Đường dẫn ảnh phải là chuỗi ký tự.',
            'image.url' => 'Ảnh phải là một URL HTTP hoặc HTTPS hợp lệ.',
            'image.max' => 'Đường dẫn ảnh tối đa 255 ký tự.',

            'status.integer' => 'Trạng thái không hợp lệ.',
            'status.in' => 'Trạng thái chỉ được là 0 (ẩn) hoặc 1 (hiển thị).',
        ];
    }
}