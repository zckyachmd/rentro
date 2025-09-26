<?php

namespace App\Models;

use App\Enum\PaymentMethod;
use App\Enum\PaymentStatus;
use App\Models\Concerns\HasAttachments;
use App\Models\Concerns\HasAudit;
use App\Models\Concerns\HasSnowflakeId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property-read Invoice|null $invoice
 */
class Payment extends Model
{
    use HasFactory;
    use HasAudit;
    use HasSnowflakeId;
    use HasAttachments;

    public $incrementing = false;
    protected $keyType   = 'int';

    protected $fillable = [
        'invoice_id',
        'method',
        'status',
        'amount_idr',
        'pre_outstanding_idr',
        'paid_at',
        'reference',
        'provider',
        'va_number',
        'va_expired_at',
        'meta',
        'note',
        'attachments',
    ];

    protected $casts = [
        'amount_idr'          => 'integer',
        'paid_at'             => 'datetime',
        'pre_outstanding_idr' => 'integer',
        'va_expired_at'       => 'datetime',
        'method'              => PaymentMethod::class,
        'status'              => PaymentStatus::class,
        'meta'                => 'array',
        'attachments'         => 'array',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
