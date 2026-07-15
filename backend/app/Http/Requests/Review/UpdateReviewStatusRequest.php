<?php

namespace App\Http\Requests\Review;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReviewStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'integer', 'in:0,1'],
            'reason' => ['nullable', 'string', 'max:500', 'required_if:status,0'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Vui lòng chọn trạng thái đánh giá.',
            'status.integer' => 'Trạng thái đánh giá không hợp lệ.',
            'status.in' => 'Trạng thái đánh giá chỉ được là ẩn hoặc hiển thị.',
            'reason.required_if' => 'Vui lòng nhập lý do khi ẩn đánh giá.',
            'reason.max' => 'Lý do không được vượt quá 500 ký tự.',
        ];
    }
}
