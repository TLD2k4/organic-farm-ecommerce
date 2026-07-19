<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Farm extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_PENDING = 0;
    public const STATUS_ACTIVE = 1;
    public const STATUS_REJECTED = 2;
    public const STATUS_SUSPENDED = 3;

    protected $fillable = [
        'seller_id',
        'approved_by',
        'name',
        'slug',
        'description',
        'logo',
        'cover_image',
        'phone',
        'address',
        'status',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'status' => 'integer',
        'approved_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function seller()
    {
        return $this->belongsTo(
            User::class,
            'seller_id'
        )->withTrashed();
    }

    public function approver()
    {
        return $this->belongsTo(
            User::class,
            'approved_by'
        )->withTrashed();
    }

    public function products()
    {
        return $this->hasMany(
            Product::class,
            'farm_id'
        );
    }

    public function subOrders()
    {
        return $this->hasMany(
            SubOrder::class,
            'farm_id'
        );
    }

    public function policyAcceptances()
    {
        return $this->hasMany(
            FarmPolicyAcceptance::class,
            'farm_id'
        );
    }

    public function completedSubOrders()
    {
        return $this->hasMany(SubOrder::class)
            ->where('status', 3)
            ->where('payment_status', 1);
    }

    public function orderItems()
    {
        return $this->hasManyThrough(
            OrderItem::class,
            SubOrder::class,
            'farm_id',
            'sub_order_id',
            'id',
            'id'
        );
    }

    public function completedOrderItems()
    {
        return $this->orderItems()
            ->whereHas('subOrder', function ($query) {
                $query->where('status', 3)
                    ->where('payment_status', 1);
            });
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    public function isSuspended(): bool
    {
        return $this->status === self::STATUS_SUSPENDED;
    }
}
