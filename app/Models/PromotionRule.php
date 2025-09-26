<?php

namespace App\Models;

use App\Enum\PromotionChannel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromotionRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'promotion_id',
        'min_spend_idr',
        'max_discount_idr',
        'applies_to_rent',
        'applies_to_deposit',
        'billing_periods',
        'date_from',
        'date_until',
        'days_of_week',
        'time_start',
        'time_end',
        'channel',
        'first_n_periods',
        'allowed_role_names',
        'allowed_user_ids',
    ];

    protected $casts = [
        'applies_to_rent'    => 'boolean',
        'applies_to_deposit' => 'boolean',
        'billing_periods'    => 'array',
        'days_of_week'       => 'array',
        'date_from'          => 'date',
        'date_until'         => 'date',
        'channel'            => PromotionChannel::class,
        'allowed_role_names' => 'array',
        'allowed_user_ids'   => 'array',
    ];

    public function promotion(): BelongsTo
    {
        return $this->belongsTo(Promotion::class);
    }
}
