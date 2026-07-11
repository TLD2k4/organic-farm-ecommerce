<?php

namespace App\Http\Requests\Home;

use Illuminate\Foundation\Http\FormRequest;

class HomeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_limit' => ['nullable', 'integer', 'min:1', 'max:12'],
            'product_limit' => ['nullable', 'integer', 'min:1', 'max:12'],
            'farm_limit' => ['nullable', 'integer', 'min:1', 'max:12'],
        ];
    }
}