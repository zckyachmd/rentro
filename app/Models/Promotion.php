<?php

namespace App\Models;

use App\Enum\PromotionChannel;
use App\Enum\PromotionStackMode;
use App\Models\Concerns\HasAudit;
use App\Models\Concerns\HasSnowflakeId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Promotion extends Model
{
    use HasFactory;
    use SoftDeletes;
    use HasAudit;
    use HasSnowflakeId;

    public $incrementing = false;
    protected $keyType   = 'int';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'valid_from',
        'valid_until',
        'stack_mode',
        'priority',
        'total_quota',
        'per_user_limit',
        'per_contract_limit',
        'per_invoice_limit',
        'per_day_limit',
        'per_month_limit',
        'default_channel',
        'require_coupon',
        'is_active',
        'is_listed',
        'tags',
        'tnc',
        'how',
    ];

    protected $casts = [
        'valid_from'      => 'date',
        'valid_until'     => 'date',
        'stack_mode'      => PromotionStackMode::class,
        'default_channel' => PromotionChannel::class,
        'require_coupon'  => 'boolean',
        'is_active'       => 'boolean',
        'is_listed'       => 'boolean',
        'priority'        => 'integer',
        'tags'            => 'array',
        'tnc'             => 'array',
        'how'             => 'array',
    ];

    public function scopes(): HasMany
    {
        return $this->hasMany(PromotionScope::class);
    }

    public function rules(): HasMany
    {
        return $this->hasMany(PromotionRule::class);
    }

    public function actions(): HasMany
    {
        return $this->hasMany(PromotionAction::class)->orderBy('priority');
    }

    public function coupons(): HasMany
    {
        return $this->hasMany(PromotionCoupon::class);
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(PromotionRedemption::class);
    }
}
