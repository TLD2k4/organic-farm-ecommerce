<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Farm extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'seller_id',
        'name',
        'slug',
        'description',
        'logo',
        'cover_image',
        'phone',
        'address',
        'status',
    ];

    protected $casts = [
        'status' => 'integer',
    ];

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function subOrders()
    {
        return $this->hasMany(SubOrder::class);
    }
}