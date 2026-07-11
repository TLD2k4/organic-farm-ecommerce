<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;
    use HasRoles;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'avatar',
        'status',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'status' => 'integer',
        'password' => 'hashed',
        'deleted_at' => 'datetime',
    ];

    /**
     * Farm mà User sở hữu.
     *
     * Bao gồm Farm đã xóa mềm để bảo đảm:
     * một tài khoản chỉ có duy nhất một Farm
     * cho đến khi Farm bị xóa vĩnh viễn.
     */
    public function farm()
    {
        return $this->hasOne(
            Farm::class,
            'seller_id'
        )->withTrashed();
    }

    public function cart()
    {
        return $this->hasOne(
            Cart::class,
            'user_id'
        );
    }

    public function addresses()
    {
        return $this->hasMany(
            Address::class,
            'user_id'
        );
    }

    public function orders()
    {
        return $this->hasMany(
            Order::class,
            'user_id'
        );
    }

    public function reviews()
    {
        return $this->hasMany(
            Review::class,
            'user_id'
        );
    }

    /**
     * Các Farm được User này duyệt.
     *
     * Thường User này là Admin.
     */
    public function approvedFarms()
    {
        return $this->hasMany(
            Farm::class,
            'approved_by'
        )->withTrashed();
    }

    /**
     * Các sản phẩm được User này duyệt.
     */
    public function approvedProducts()
    {
        return $this->hasMany(
            Product::class,
            'approved_by'
        )->withTrashed();
    }

    /**
     * Các chứng nhận sản phẩm được User này duyệt.
     */
    public function approvedCertificates()
    {
        return $this->hasMany(
            ProductCertificate::class,
            'approved_by'
        );
    }
}
