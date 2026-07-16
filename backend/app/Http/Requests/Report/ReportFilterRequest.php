<?php

namespace App\Http\Requests\Report;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from_date' => [
                'nullable',
                'date',
            ],

            'to_date' => [
                'nullable',
                'date',
            ],

            'group_by' => [
                'nullable',
                Rule::in([
                    'auto',
                    'day',
                    'week',
                    'month',
                    'year',
                ]),
            ],

            'limit' => [
                'nullable',
                'integer',
                'min:5',
                'max:50',
            ],
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                $fromDate = $this->input('from_date');
                $toDate = $this->input('to_date');

                if (!$fromDate || !$toDate) {
                    return;
                }

                if (
                    Carbon::parse($toDate)
                    ->lt(Carbon::parse($fromDate))
                ) {
                    $validator
                        ->errors()
                        ->add(
                            'to_date',
                            'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.'
                        );
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'from_date.date' =>
            'Ngày bắt đầu không hợp lệ.',

            'to_date.date' =>
            'Ngày kết thúc không hợp lệ.',

            'group_by.in' =>
            'Kiểu nhóm chỉ được là auto, day, week, month hoặc year.',

            'limit.integer' =>
            'Giới hạn phải là số nguyên.',

            'limit.min' =>
            'Giới hạn tối thiểu là 5.',

            'limit.max' =>
            'Giới hạn tối đa là 50.',
        ];
    }
}
