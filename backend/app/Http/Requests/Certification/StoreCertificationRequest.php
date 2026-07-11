<?php

namespace App\Http\Requests\Certification;

use Illuminate\Foundation\Http\FormRequest;

class StoreCertificationRequest extends FormRequest
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
            'name' => 'required|string|max:25|unique:certifications,name',
            'description' => 'nullable|string|max:1000',
            'status' => 'nullable|in:0,1',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên chứng chỉ không được để trống.',
            'name.unique' => 'Tên chứng chỉ đã tồn tại.',
            'name.max' => 'Tên tối đa 25 ký tự.',

            'description.max' => 'Mô tả tối đa 1000 ký tự.',
            'status.in' => 'Trạng thái không hợp lệ (0 hoặc 1).',
        ];
    }
}
