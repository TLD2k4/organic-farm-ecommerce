<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [ // thêm ở đây
        'farm_id',
        'category_id',
        'name',
        'slug',
        'description',
        'price',
        'sale_price',
        'stock_quantity',
        'unit',
        'thumbnail',
        'is_hot',
        'status',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'admin_locked_by',
        'admin_locked_at',
        'admin_lock_reason',
    ];

    protected $casts = [ // thêm ở đây
        'price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'stock_quantity' => 'decimal:2',
        'is_hot' => 'boolean',
        'status' => 'integer',
        'approved_at' => 'datetime',
        'admin_locked_at' => 'datetime',
    ];

    // khi farm bị xóa mềm thì sản phẩm cũg ko hiển thị nhưg order vẫn còn ko ảh hưởg nghiệp vụ 
    // Muốn xem thì phải sài withTrashed()
    protected static function booted()
    {
        static::addGlobalScope('farm_not_deleted', function ($query) {
            $query->whereHas('farm', function ($q) {
                $q->whereNull('deleted_at');
            });
        });
    }

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function certificates()
    {
        return $this->hasMany(ProductCertificate::class);
    }

    public function certificate()
    {
        return $this->hasOne(ProductCertificate::class)
            ->where('status', 1)
            ->where('expiry_date', '>=', today())
            ->latestOfMany();
    }

    public function approver() // thêm ở đây
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function adminLocker()
    {
        return $this->belongsTo(User::class, 'admin_locked_by')->withTrashed();
    }

    public function approvedCertificate()
    {
        return $this->hasOne(ProductCertificate::class)
            ->where('status', 1)
            ->where('expiry_date', '>=', today())
            ->latestOfMany();
    }

    public function harvestLots()
    {
        return $this->hasManyThrough(
            HarvestLot::class,
            ProductCertificate::class,
            'product_id',
            'product_certificate_id',
            'id',
            'id'
        );
    }
    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function completedOrderItems()
    {
        return $this->hasMany(OrderItem::class)
            ->whereHas('subOrder', function ($q) {
                $q->where('status', 3) // 3 = Hoàn tất
                    ->where('payment_status', '!=', 3); // không tính hoàn tiền
            });
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function visibleReviews()
    {
        return $this->reviews()
            ->where('reviews.status', 1)
            ->where(function ($query) {
                $query->whereNull('order_item_id')
                    ->orWhereHas('orderItem.subOrder', function ($q) {
                        $q->where('status', 3)
                            ->where('payment_status', '!=', 3);
                    });
            });
    }

    public function visibleRatingReviews()
    {
        return $this->reviews()
            ->where('reviews.status', 1)
            ->whereNotNull('reviews.order_item_id')
            ->whereNotNull('reviews.rating')
            ->whereHas('orderItem.subOrder', function ($query) {
                $query->where('status', 3)->where('payment_status', '!=', 3);
            });
    }

    public function visibleComments()
    {
        return $this->reviews()
            ->where('reviews.status', 1)
            ->whereNull('reviews.order_item_id')
            ->whereNull('reviews.rating');
    }
}
