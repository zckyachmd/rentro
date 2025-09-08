<?php

namespace App\Models;

use App\Enum\PaymentMethod;
use App\Enum\PaymentStatus;
use App\Models\Concerns\HasAudit;
use App\Models\Concerns\HasSnowflakeId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;
    use HasAudit;
    use HasSnowflakeId;

    public $incrementing = false;
    protected $keyType   = 'int';

    protected $fillable = [
        'invoice_id',
        'method',
        'status',
        'amount_cents',
        'pre_outstanding_cents',
        'paid_at',
        'reference',
        'provider',
        'va_number',
        'va_expired_at',
        'meta',
        'note',
    ];

    protected $casts = [
        'amount_cents'          => 'integer',
        'paid_at'               => 'datetime',
        'pre_outstanding_cents' => 'integer',
        'va_expired_at'         => 'datetime',
        'method'                => PaymentMethod::class,
        'status'                => PaymentStatus::class,
        'meta'                  => 'array',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
