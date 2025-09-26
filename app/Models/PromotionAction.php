<?php

namespace App\Models;

use App\Enum\PromotionActionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromotionAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'promotion_id',
        'action_type',
        'applies_to_rent',
        'applies_to_deposit',
        'percent_bps',
        'amount_idr',
        'fixed_price_idr',
        'n_days',
        'n_periods',
        'max_discount_idr',
        'priority',
    ];

    protected $casts = [
        'action_type'        => PromotionActionType::class,
        'applies_to_rent'    => 'boolean',
        'applies_to_deposit' => 'boolean',
        'priority'           => 'integer',
    ];

    public function promotion(): BelongsTo
    {
        return $this->belongsTo(Promotion::class);
    }
}
