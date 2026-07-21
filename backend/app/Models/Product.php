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


    /**
     * Một nguồn chuẩn cho toàn bộ khu vực công khai.
     *
     * Sản phẩm chỉ công khai khi bản thân sản phẩm, gian hàng, danh mục
     * (và danh mục cha nếu có), chứng chỉ hiện hành và loại chứng nhận
     * đều còn hoạt động.
     */
    public function scopePubliclyVisible($query)
    {
        return $query
            ->where('products.status', 1)
            ->whereHas('farm', function ($farmQuery) {
                $farmQuery->where('status', Farm::STATUS_ACTIVE);
            })
            ->whereHas('category', function ($categoryQuery) {
                $categoryQuery->visible();
            })
            ->whereHas('certificate', function ($certificateQuery) {
                $certificateQuery->whereHas('certification', function ($certificationQuery) {
                    $certificationQuery->where('status', 1);
                });
            });
    }

    /**
     * Kiểm tra một model đã load có thật sự được mở trang công khai không.
     */
    public function isPubliclyVisible(): bool
    {
        if ($this->trashed() || (int) $this->status !== 1) {
            return false;
        }

        $this->loadMissing([
            'farm',
            'category.parent',
            'approvedCertificate.certification',
        ]);

        if (!$this->farm
            || $this->farm->trashed()
            || (int) $this->farm->status !== Farm::STATUS_ACTIVE
        ) {
            return false;
        }

        if (!$this->category
            || $this->category->trashed()
            || (int) $this->category->status !== 1
        ) {
            return false;
        }

        if ($this->category->parent_id !== null) {
            $parent = $this->category->parent;

            if (!$parent || $parent->trashed() || (int) $parent->status !== 1) {
                return false;
            }
        }

        $certificate = $this->approvedCertificate;

        return $certificate !== null
            && $certificate->certification !== null
            && !$certificate->certification->trashed()
            && (int) $certificate->certification->status === 1;
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
            ->ofMany(['id' => 'max'], function ($query) {
                $query->where('status', 1)
                    ->whereDate('expiry_date', '>=', today());
            });
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
            ->ofMany(['id' => 'max'], function ($query) {
                $query->where('status', 1)
                    ->whereDate('expiry_date', '>=', today());
            });
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
                    ->where('payment_status', 1)
                    ->whereNotNull('completed_at');
            })
            ->whereHas('subOrder.order', function ($q) {
                $q->where('status', 3);
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
                            ->where('payment_status', 1)
                            ->whereNotNull('completed_at')
                            ->whereHas('order', function ($orderQuery) {
                                $orderQuery->where('status', 3);
                            });
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
                $query->where('status', 3)
                    ->where('payment_status', 1)
                    ->whereNotNull('completed_at')
                    ->whereHas('order', function ($orderQuery) {
                        $orderQuery->where('status', 3);
                    });
            });
    }

    public function visibleComments()
    {
        return $this->reviews()
            ->where('reviews.status', 1)
            ->whereNotNull('reviews.comment')
            ->whereRaw("TRIM(reviews.comment) <> ''")
            ->where(function ($query) {
                $query->whereNull('order_item_id')
                    ->orWhereHas('orderItem.subOrder', function ($q) {
                        $q->where('status', 3)
                            ->where('payment_status', 1)
                            ->whereNotNull('completed_at')
                            ->whereHas('order', function ($orderQuery) {
                                $orderQuery->where('status', 3);
                            });
                    });
            });
    }

    public function visibleReviewReplies()
    {
        return $this->hasManyThrough(
            ReviewReply::class,
            Review::class,
            'product_id',
            'review_id',
            'id',
            'id'
        )
            ->where('reviews.status', 1)
            ->where('review_replies.status', 1)
            ->whereNotNull('review_replies.comment')
            ->whereRaw("TRIM(review_replies.comment) <> ''");
    }
}
