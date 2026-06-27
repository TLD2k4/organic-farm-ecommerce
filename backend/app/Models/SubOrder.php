<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SubOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_id',
        'farm_id',
        'sub_order_code',
        'items_total',
        'shipping_fee',
        'total',
        'status',
        'payment_status',
        'seller_note',
    ];

    protected $casts = [
        'items_total' => 'decimal:2',
        'shipping_fee' => 'decimal:2',
        'total' => 'decimal:2',
        'status' => 'integer',
        'payment_status' => 'integer',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}