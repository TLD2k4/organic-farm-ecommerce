<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class HarvestLot extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_certificate_id',
        'lot_code',
        'harvest_date',
        'expiry_date',
        'quantity_imported',
        'quantity_sold',
        'quantity_remaining',
        'status',
        'note',
    ];

    protected $casts = [
        'harvest_date' => 'date',
        'expiry_date' => 'date',
        'quantity_imported' => 'decimal:2',
        'quantity_sold' => 'decimal:2',
        'quantity_remaining' => 'decimal:2',
        'status' => 'integer',
    ];

    public function productCertificate()
    {
        return $this->belongsTo(ProductCertificate::class, 'product_certificate_id');
    }

    // public function getProductAttribute()
    // {
    //     return $this->productCertificate?->product;
    // }

    // public function getCertificationAttribute()
    // {
    //     return $this->productCertificate?->certification;
    // }
    public function orderItemLots()
    {
        return $this->hasMany(OrderItemLot::class);
    }
}
