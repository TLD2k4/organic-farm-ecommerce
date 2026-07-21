<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'parent_id',
        'name',
        'slug',
        'description',
        'image',
        'status',
    ];

    protected $casts = [
        'status' => 'integer',
    ];

    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function activeChildren()
    {
        return $this->hasMany(Category::class, 'parent_id')
            ->where('status', 1);
    }

    public function scopeVisible($query)
    {
        return $query
            ->where('status', 1)
            ->whereNull('deleted_at')
            ->where(function ($visibilityQuery) {
                $visibilityQuery
                    ->whereNull('parent_id')
                    ->orWhereHas('parent', function ($parentQuery) {
                        $parentQuery->where('status', 1);
                    });
            });
    }
}
