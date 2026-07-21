<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RenewProductCertificateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('certificate_number')) {
            $this->merge([
                'certificate_number' => trim((string) $this->input('certificate_number')),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            // Không cho seller đổi loại chứng chỉ.
            // Backend tự lấy loại chứng chỉ từ chứng chỉ Approved hiện tại.
            'certification_id' => ['prohibited'],

            'certificate_number' => [
                'required',
                'string',
                'max:100',
                Rule::unique('product_certificates', 'certificate_number')
                    ->where(fn ($query) => $query->where('status', '!=', 2)),
            ],

            'certificate_file' => ['required', 'string', 'max:255'],

            'issued_date' => ['required', 'date', 'before_or_equal:today'],
            'expiry_date' => ['required', 'date', 'after:issued_date', 'after_or_equal:today'],

            'product_id' => ['prohibited'],
            'status' => ['prohibited'],
            'approved_by' => ['prohibited'],
            'approved_at' => ['prohibited'],
            'rejection_reason' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'certification_id.prohibited' => 'Không được đổi loại chứng chỉ. Muốn đổi chứng chỉ phải tạo sản phẩm mới.',

            'certificate_number.required' => 'Số chứng chỉ không được để trống.',
            'certificate_number.unique' => 'Số chứng chỉ đang chờ duyệt hoặc đã từng được duyệt nên không thể dùng lại.',
            'certificate_number.max' => 'Số chứng chỉ không được vượt quá 100 ký tự.',

            'certificate_file.required' => 'File chứng chỉ không được để trống.',
            'certificate_file.max' => 'Đường dẫn file chứng chỉ không được vượt quá 255 ký tự.',

            'issued_date.required' => 'Ngày cấp không được để trống.',
            'issued_date.date' => 'Ngày cấp không hợp lệ.',
            'issued_date.before_or_equal' => 'Ngày cấp không được lớn hơn ngày hiện tại.',

            'expiry_date.required' => 'Ngày hết hạn không được để trống.',
            'expiry_date.date' => 'Ngày hết hạn không hợp lệ.',
            'expiry_date.after' => 'Ngày hết hạn phải sau ngày cấp.',
            'expiry_date.after_or_equal' => 'Chứng chỉ mới không được hết hạn.',

            'product_id.prohibited' => 'Không được tự gửi mã sản phẩm.',
            'status.prohibited' => 'Không được tự thiết lập trạng thái chứng chỉ.',
            'approved_by.prohibited' => 'Không được tự thiết lập người duyệt.',
            'approved_at.prohibited' => 'Không được tự thiết lập thời gian duyệt.',
            'rejection_reason.prohibited' => 'Không được tự thiết lập lý do từ chối.',
        ];
    }
}
