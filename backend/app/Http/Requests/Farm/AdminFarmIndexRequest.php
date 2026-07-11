<?php

namespace App\Http\Requests\Farm;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminFarmIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'keyword' => [
                'nullable',
                'string',
                'max:100',
            ],

            'status' => [
                'nullable',
                'integer',
                Rule::in([0, 1, 2, 3]),
            ],

            /*
             * null = lấy tất cả
             * 0 = chưa xóa
             * 1 = chỉ lấy đã xóa mềm
             */
            'deleted' => [
                'nullable',
                'integer',
                Rule::in([0, 1]),
            ],

            'limit' => [
                'nullable',
                'integer',
                'min:1',
                'max:50',
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'keyword.max' => 'Từ khóa tìm kiếm tối đa 100 ký tự.',
            'status.in' => 'Trạng thái nông trại không hợp lệ.',
            'deleted.in' => 'Bộ lọc xóa không hợp lệ.',
            'limit.min' => 'Số dòng tối thiểu là 1.',
            'limit.max' => 'Số dòng tối đa là 50.',
            'page.min' => 'Trang phải lớn hơn hoặc bằng 1.',
        ];
    }
}
