<?php

namespace App\Models;

use App\Models\Concerns\HasAudit;
use App\Models\Concerns\HasSnowflakeId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PromotionCoupon extends Model
{
    use HasFactory;
    use SoftDeletes;
    use HasAudit;
    use HasSnowflakeId;

    public $incrementing = false;
    protected $keyType   = 'int';

    protected $fillable = [
        'promotion_id',
        'code',
        'is_active',
        'max_redemptions',
        'redeemed_count',
        'expires_at',
    ];

    protected $casts = [
        'is_active'       => 'boolean',
        'expires_at'      => 'datetime',
        'max_redemptions' => 'integer',
        'redeemed_count'  => 'integer',
    ];

    public function promotion(): BelongsTo
    {
        return $this->belongsTo(Promotion::class);
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(PromotionRedemption::class, 'coupon_id');
    }
}
