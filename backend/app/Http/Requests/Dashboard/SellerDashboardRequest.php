<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class SellerDashboardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date', 'after_or_equal:from_date'],
            'top_limit' => ['nullable', 'integer', 'in:5,10,15,20'],
        ];
    }

    public function messages(): array
    {
        return [
            'from_date.date' => 'Ngày bắt đầu không hợp lệ.',
            'to_date.date' => 'Ngày kết thúc không hợp lệ.',
            'to_date.after_or_equal' => 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.',
            'top_limit.integer' => 'Số lượng Top phải là số nguyên.',
            'top_limit.in' => 'Số lượng Top chỉ nhận 5, 10, 15 hoặc 20.',
        ];
    }
}