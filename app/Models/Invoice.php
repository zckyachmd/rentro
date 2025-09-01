<?php

namespace App\Models;

use App\Enum\InvoiceStatus;
use App\Models\Concerns\HasAudit;
use App\Models\Concerns\HasSnowflakeId;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory;
    use SoftDeletes;
    use HasAudit;
    use HasSnowflakeId;

    public $incrementing = false;
    protected $keyType   = 'int';

    protected $fillable = [
        'contract_id',
        'number',
        'period_start',
        'period_end',
        'due_date',
        'amount_cents',
        'items',
        'status',
        'paid_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end'   => 'date',
        'due_date'     => 'date',
        'paid_at'      => 'datetime',
        'amount_cents' => 'integer',
        'items'        => 'array',
        'status'       => InvoiceStatus::class,
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Build a normalized invoice line item.
     *
     * @param string $code Short code (e.g., PRORATA, RENT, DEPOSIT)
     * @param string $label Human readable label
     * @param int $amountCents Amount in cents (>= 0)
     * @param array|null $meta Optional meta, e.g. ['unit' => 'bulan','qty' => 6,'unit_price_cents' => 90000000]
     * @return array{code:string,label:string,amount_cents:int,meta?:array}
     */
    public static function makeItem(string $code, string $label, int $amountCents, ?array $meta = null): array
    {
        $item = [
            'code'         => $code,
            'label'        => $label,
            'amount_cents' => $amountCents,
        ];
        if ($meta) {
            $item['meta'] = $meta;
        }

        return $item;
    }

    /**
     * Sum amount_cents from invoice items array.
     *
     * @param array<int, array{amount_cents:int}> $items
     */
    public static function sumItems(array $items): int
    {
        return array_reduce($items, static function (int $carry, array $it): int {
            return $carry + (int) $it['amount_cents'];
        }, 0);
    }

    /**
     * Get due date in the same month by day-of-month.
     */
    public static function sameMonthDueDate(Carbon $anchor, int $dayOfMonth): ?string
    {
        $dom    = max(1, min(31, $dayOfMonth));
        $d      = $anchor->copy()->day(1);
        $target = $d->copy()->day(min($dom, $d->daysInMonth));

        return $target->toDateString();
    }

    /**
     * Get next due date from a given date by day-of-month.
     */
    public static function nextDueDayFrom(Carbon $from, int $dayOfMonth): string
    {
        $dom       = max(1, min(31, $dayOfMonth));
        $candidate = $from->copy()->day(min($dom, $from->daysInMonth));
        if ($candidate->lessThan($from)) {
            $candidate = $from->copy()->addMonthNoOverflow()->day(1);
            $candidate = $candidate->copy()->day(min($dom, $candidate->daysInMonth));
        }

        return $candidate->toDateString();
    }

    /**
     * Generate unique invoice number (INV-YYYYMM-XXXXXX).
     */
    public static function makeNumber(): string
    {
        do {
            $candidate = 'INV-' . now()->format('Ym') . '-' . strtoupper(str()->random(6));
        } while (static::where('number', $candidate)->exists());

        return $candidate;
    }
}
