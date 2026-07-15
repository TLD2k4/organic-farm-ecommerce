<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class AdminOrderIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'keyword' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'integer', 'in:0,1,2,3,4'],
            'payment_status' => ['nullable', 'integer', 'in:0,1,2,3'],
            'payment_method' => ['nullable', 'string', 'in:COD,MOMO'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'deleted' => ['nullable', 'integer', 'in:0,1'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'Trạng thái đơn tổng không hợp lệ.',
            'payment_status.in' => 'Trạng thái thanh toán không hợp lệ.',
            'payment_method.in' => 'Phương thức thanh toán không hợp lệ.',
            'date_to.after_or_equal' => 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.',
            'deleted.in' => 'Bộ lọc dữ liệu đã xóa không hợp lệ.',
            'per_page.min' => 'Số dòng mỗi trang tối thiểu là 5.',
            'per_page.max' => 'Số dòng mỗi trang tối đa là 50.',
        ];
    }
}
