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
        $data = [];

        if ($this->has('name')) {
            $data['name'] = preg_replace(
                '/\s+/u',
                ' ',
                trim((string) $this->input('name'))
            );
        }

        if ($this->has('description')) {
            $description = trim((string) $this->input('description', ''));
            $data['description'] = $description !== '' ? $description : null;
        }

        if ($data !== []) {
            $this->merge($data);
        }
    }

    public function rules(): array
    {
        $certificationId = (int) $this->route('id');

        return [
            'name' => [
                'sometimes',
                'bail',
                'required',
                'string',
                'min:2',
                'max:25',
                Rule::unique('certifications', 'name')->ignore($certificationId),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'status' => ['nullable', 'integer', 'in:0,1'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên chứng chỉ không được để trống.',
            'name.string' => 'Tên chứng chỉ phải là chuỗi ký tự.',
            'name.min' => 'Tên chứng chỉ phải có ít nhất 2 ký tự.',
            'name.max' => 'Tên chứng chỉ tối đa 25 ký tự.',
            'name.unique' => 'Tên chứng chỉ đã tồn tại.',

            'description.string' => 'Mô tả phải là chuỗi ký tự.',
            'description.max' => 'Mô tả tối đa 1000 ký tự.',

            'status.integer' => 'Trạng thái không hợp lệ.',
            'status.in' => 'Trạng thái chỉ được là 0 (ẩn) hoặc 1 (hiển thị).',
        ];
    }
}
