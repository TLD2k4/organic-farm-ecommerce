<?php
// backend\app\Services\Upload\CloudinaryUploadService.php
namespace App\Services\Upload;

use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;

class CloudinaryUploadService
{
    public function upload(UploadedFile $file, string $type): array
    {
        $cloudinary = new Cloudinary(config('cloudinary.cloud_url'));

        $folder = $this->getFolder($type);

        $result = $cloudinary->uploadApi()->upload(
            $file->getRealPath(),
            [
                'folder' => $folder,
                'resource_type' => 'auto',
                'use_filename' => true,
                'unique_filename' => true,
                'overwrite' => false,
            ]
        );

        return [
            'url' => $result['secure_url'],
            'secure_url' => $result['secure_url'],
            'public_id' => $result['public_id'] ?? null,
            'resource_type' => $result['resource_type'] ?? null,
            'format' => $result['format'] ?? null,
            'bytes' => $result['bytes'] ?? null,
            'original_name' => $file->getClientOriginalName(),
            'type' => $type,
        ];
    }

    private function getFolder(string $type): string
    {
        return match ($type) {
            'product_thumbnail' => 'organic-farm/products/thumbnails',
            'product_detail' => 'organic-farm/products/details',
            'certificate_file' => 'organic-farm/certificates',
            'user_avatar' => 'organic-farm/users/avatars',
            'farm_logo' => 'organic-farm/farms/logos',
            'farm_cover' => 'organic-farm/farms/covers',
            'category_image'    => 'organic-farm/categories',
            default => 'organic-farm/uploads',
        };
    }
}
