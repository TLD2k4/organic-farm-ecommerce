<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductCertificate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'certification_id',
        'certificate_number',
        'certificate_file',
        'issued_date',
        'expiry_date',
        'status',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'issued_date' => 'date',
        'expiry_date' => 'date',
        'approved_at' => 'datetime',
        'status' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Dùng cho màn hình quản trị/lịch sử cần đọc cả sản phẩm đã xóa mềm.
     * Quan hệ product() mặc định vẫn giữ nguyên để không làm lộ dữ liệu đã xóa
     * ở các truy vấn công khai hoặc nghiệp vụ đang hoạt động.
     */
    public function productIncludingDeleted()
    {
        return $this->belongsTo(Product::class, 'product_id')
            ->withoutGlobalScope('farm_not_deleted')
            ->withTrashed();
    }

    public function certification()
    {
        return $this->belongsTo(Certification::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
    
    public function harvestLots()
    {
        return $this->hasMany(HarvestLot::class, 'product_certificate_id');
    }
}