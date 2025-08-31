<?php

namespace App\Models;

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use App\Models\Concerns\HasAudit;
use App\Models\Concerns\HasSnowflakeId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contract extends Model
{
    use HasFactory;
    use SoftDeletes;
    use HasAudit;
    use HasSnowflakeId;

    public $incrementing = false;
    protected $keyType   = 'int';

    protected $fillable = [
        'user_id',
        'room_id',
        'start_date',
        'end_date',
        'rent_cents',
        'deposit_cents',
        'billing_period',
        'billing_day',
        'auto_renew',
        'renewal_cancelled_at',
        'deposit_refund_cents',
        'deposit_refunded_at',
        'status',
        'notes',
    ];

    protected $casts = [
        'start_date'           => 'date',
        'end_date'             => 'date',
        'rent_cents'           => 'integer',
        'deposit_cents'        => 'integer',
        'billing_day'          => 'integer',
        'billing_period'       => BillingPeriod::class,
        'status'               => ContractStatus::class,
        'auto_renew'           => 'boolean',
        'renewal_cancelled_at' => 'datetime',
        'deposit_refunded_at'  => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function payments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Payment::class,
            Invoice::class,
            'contract_id', // Foreign key on invoices
            'invoice_id',  // Foreign key on payments
            'id',          // Local key on contracts
            'id',           // Local key on invoices
        );
    }
}
