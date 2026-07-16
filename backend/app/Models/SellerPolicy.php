<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SellerPolicy extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 0;
    public const STATUS_PUBLISHED = 1;
    public const STATUS_ARCHIVED = 2;

    protected $fillable = [
        'version', 'title', 'summary', 'content', 'status',
        'requires_reacceptance', 'effective_at', 'created_by',
        'updated_by', 'published_by', 'published_at', 'change_note',
    ];

    protected $casts = [
        'status' => 'integer',
        'requires_reacceptance' => 'boolean',
        'effective_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    public function acceptances() { return $this->hasMany(FarmPolicyAcceptance::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by')->withTrashed(); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by')->withTrashed(); }
    public function publisher() { return $this->belongsTo(User::class, 'published_by')->withTrashed(); }

    public static function current(): ?self
    {
        return static::query()
            ->where('status', self::STATUS_PUBLISHED)
            ->whereNotNull('published_at')
            ->where(fn ($query) => $query->whereNull('effective_at')->orWhere('effective_at', '<=', now()))
            ->latest('effective_at')
            ->latest('published_at')
            ->first();
    }
}
