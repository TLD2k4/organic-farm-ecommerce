<?php
//backend\app\Http\Controllers\Upload\UploadController.php
namespace App\Http\Controllers\Upload;

use App\Http\Controllers\Controller;
use App\Http\Requests\Upload\UploadFileRequest;
use App\Services\Upload\CloudinaryUploadService;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function __construct(
        private CloudinaryUploadService $cloudinaryUploadService
    ) {}

    public function store(UploadFileRequest $request)
    {
        $data = $request->validated();

        $uploaded = $this->cloudinaryUploadService->upload(
            file: $request->file('file'),
            type: $data['type']
        );

        return response()->json([
            'success' => true,
            'message' => 'Upload file thành công.',
            'data' => $uploaded,
        ], 201);
    }

    public function storeRegisterAvatar(Request $request)
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                'max:5120',
                'mimes:jpg,jpeg,png,webp',
            ],
        ], [
            'file.required' => 'Vui lòng chọn ảnh đại diện.',
            'file.file' => 'File upload không hợp lệ.',
            'file.max' => 'Ảnh đại diện không được vượt quá 5MB.',
            'file.mimes' => 'Ảnh đại diện phải là jpg, jpeg, png hoặc webp.',
        ]);

        $uploaded = $this->cloudinaryUploadService->upload(
            file: $request->file('file'),
            type: 'user_avatar'
        );

        return response()->json([
            'success' => true,
            'message' => 'Upload avatar thành công.',
            'data' => $uploaded,
        ], 201);
    }
}
