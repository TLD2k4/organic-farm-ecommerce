<?php
// backend\app\Http\Requests\Upload\UploadFileRequest.php
namespace App\Http\Requests\Upload;

use Illuminate\Foundation\Http\FormRequest;

class UploadFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $type = $this->input('type');

        $mimes = $type === 'certificate_file'
            ? 'jpg,jpeg,png,webp,pdf'
            : 'jpg,jpeg,png,webp';

        return [
            'type' => [
                'required',
                'string',
                'in:product_thumbnail,product_detail,certificate_file,user_avatar,farm_logo,farm_cover,category_image',
            ],

            'file' => [
                'required',
                'file',
                'max:10240',
                "mimes:{$mimes}",
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Loại upload không được để trống.',
            'type.in' => 'Loại upload không hợp lệ.',

            'file.required' => 'Vui lòng chọn file.',
            'file.file' => 'File upload không hợp lệ.',
            'file.max' => 'File không được vượt quá 10MB.',
            'file.mimes' => 'Định dạng file không hợp lệ.',
        ];
    }
}
