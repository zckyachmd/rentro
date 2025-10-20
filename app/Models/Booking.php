<?php

namespace App\Models;

use App\Enum\BillingPeriod;
use App\Enum\BookingStatus;
use App\Models\Concerns\HasAudit;
use App\Models\Concerns\HasSnowflakeId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property-read User|null $tenant
 * @property-read Room|null $room
 * @property-read Contract|null $contract
 */
class Booking extends Model
{
    use HasFactory;
    use SoftDeletes;
    use HasAudit;
    use HasSnowflakeId;

    public $incrementing = false;
    protected $keyType   = 'int';

    protected $fillable = [
        'number',
        'user_id',
        'room_id',
        'start_date',
        'duration_count',
        'billing_period',
        'promo_code',
        'notes',
        'status',
        'approved_at',
        'rejected_at',
        'contract_id',
        'estimate',
    ];

    protected $casts = [
        'start_date'     => 'date',
        'duration_count' => 'integer',
        'billing_period' => BillingPeriod::class,
        'status'         => BookingStatus::class,
        'approved_at'    => 'datetime',
        'rejected_at'    => 'datetime',
        'estimate'       => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }
}
