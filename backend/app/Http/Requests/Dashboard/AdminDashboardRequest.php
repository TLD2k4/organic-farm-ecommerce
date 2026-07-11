<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminDashboardRequest extends FormRequest
{
    public function authorize(): bool
    {
        /*
         * Route đã được bảo vệ bằng:
         * auth:sanctum + role:admin
         */
        return true;
    }

    public function rules(): array
    {
        return [
            'days' => [
                'nullable',
                'integer',
                Rule::in([7, 30, 90]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'days.integer' => 'Khoảng thời gian phải là số nguyên.',
            'days.in' => 'Khoảng thời gian chỉ được chọn 7, 30 hoặc 90 ngày.',
        ];
    }
}