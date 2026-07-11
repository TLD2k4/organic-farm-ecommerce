<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sub_order_id',
        'product_id',
        'product_name',
        'product_image',
        'unit',
        'quantity',
        'price',
        'subtotal',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'price' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function subOrder()
    {
        return $this->belongsTo(SubOrder::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function review()
    {
        return $this->hasOne(Review::class);
    }

    public function harvestLots()
    {
        return $this->hasMany(OrderItemLot::class);
    }
    public function orderItemLots()
    {
        return $this->hasMany(OrderItemLot::class);
    }
}