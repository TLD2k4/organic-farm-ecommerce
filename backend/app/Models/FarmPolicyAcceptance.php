<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FarmPolicyAcceptance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'farm_id',
        'seller_policy_id',
        'policy_version',
        'accepted_at',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'accepted_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    public function policy()
    {
        return $this->belongsTo(SellerPolicy::class, 'seller_policy_id')->withTrashed();
    }
}
