<?php

namespace App\Http\Requests\Review;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReviewRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'entry_type' => $this->input('entry_type', 'rating_review'),
        ]);
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'entry_type' => ['required', Rule::in(['rating_review', 'buyer_comment'])],
            'order_item_id' => ['nullable', 'required_if:entry_type,rating_review', 'integer', 'exists:order_items,id'],
            'product_id' => ['nullable', 'required_if:entry_type,buyer_comment', 'integer', 'exists:products,id'],
            'rating' => ['nullable', 'required_if:entry_type,rating_review', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'required_if:entry_type,buyer_comment', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'order_item_id.required' => 'Vui lòng chọn sản phẩm đã mua để đánh giá.',
            'order_item_id.exists' => 'Sản phẩm trong đơn hàng không tồn tại.',
            'product_id.required' => 'Vui lòng chọn sản phẩm đã mua để bình luận.',
            'product_id.exists' => 'Sản phẩm cần bình luận không tồn tại.',
            'rating.required' => 'Vui lòng chọn số sao đánh giá.',
            'rating.min' => 'Đánh giá tối thiểu là 1 sao.',
            'rating.max' => 'Đánh giá tối đa là 5 sao.',
            'comment.required' => 'Vui lòng nhập nội dung bình luận.',
            'comment.max' => 'Nội dung tối đa 1000 ký tự.',
        ];
    }
}
