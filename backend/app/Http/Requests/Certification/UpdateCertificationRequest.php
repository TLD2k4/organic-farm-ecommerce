<?php

namespace App\Http\Requests\Certification;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCertificationRequest extends FormRequest
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
                'name' => $name,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:25',
                Rule::unique('certifications', 'name')->ignore($this->route('id')),
            ],
            'description' => 'nullable|string|max:1000',
            'status' => 'nullable|in:0,1',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên chứng chỉ không được để trống.',
            'name.string' => 'Tên chứng chỉ phải là chuỗi ký tự.',
            'name.max' => 'Tên tối đa 25 ký tự.',
            'name.unique' => 'Tên chứng chỉ đã tồn tại.',

            'description.string' => 'Mô tả phải là chuỗi ký tự.',
            'description.max' => 'Mô tả tối đa 1000 ký tự.',

            'status.in' => 'Trạng thái chỉ được là 0 (ẩn) hoặc 1 (hiển thị).',
        ];
    }
}
