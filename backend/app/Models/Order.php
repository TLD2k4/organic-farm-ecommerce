<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'address_id',
        'order_code',
        'shipping_name',
        'shipping_phone',
        'shipping_address',
        'shipping_fee',
        'items_total',
        'grand_total',
        'status',
    ];

    protected $casts = [
        'shipping_fee' => 'decimal:2',
        'items_total' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'status' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function address()
    {
        return $this->belongsTo(Address::class);
    }

    public function subOrders()
    {
        return $this->hasMany(SubOrder::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }
}