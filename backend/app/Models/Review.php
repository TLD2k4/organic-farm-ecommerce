<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Review extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'order_item_id',
        'product_id',
        'rating',
        'comment',
        'status',
        'moderated_by',
        'moderated_at',
        'moderation_reason',
    ];

    protected $casts = [
        'rating' => 'integer',
        'status' => 'integer',
        'moderated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderated_by')->withTrashed();
    }

    public function replies()
    {
        return $this->hasMany(ReviewReply::class)->oldest();
    }
}
