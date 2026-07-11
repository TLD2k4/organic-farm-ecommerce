<?php

namespace App\Http\Requests\Review;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'rating.required' => 'Vui lòng chọn số sao đánh giá.',
            'rating.integer' => 'Số sao đánh giá không hợp lệ.',
            'rating.min' => 'Đánh giá tối thiểu 1 sao.',
            'rating.max' => 'Đánh giá tối đa 5 sao.',
            'comment.max' => 'Nội dung đánh giá tối đa 1000 ký tự.',
        ];
    }
}