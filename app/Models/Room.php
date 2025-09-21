<?php

namespace App\Models;

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use App\Enum\GenderPolicy;
use App\Enum\RoomStatus;
use App\Models\Concerns\HasAudit;
use App\Models\Concerns\HasSnowflakeId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property-read Building|null $building
 * @property-read Floor|null $floor
 * @property-read RoomType|null $type
 * @property-read \Illuminate\Database\Eloquent\Collection<int, RoomPhoto> $photos
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Amenity> $amenities
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Contract> $contracts
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Contract> $holdingContracts
 * @property RoomStatus $status
 */
class Room extends Model
{
    use HasFactory;
    use SoftDeletes;
    use HasAudit;
    use HasSnowflakeId;

    public $incrementing = false;
    protected $keyType   = 'int';

    protected $fillable = [
        'building_id',
        'floor_id',
        'room_type_id',
        'number',
        'name',
        'size_m2',
        'price_overrides',
        'deposit_overrides',
        'max_occupancy',
        'status',
        'gender_policy',
        'notes',
    ];

    protected $casts = [
        'size_m2'           => 'decimal:2',
        'price_overrides'   => 'array',
        'deposit_overrides' => 'array',
        'max_occupancy'     => 'integer',
        'status'            => RoomStatus::class,
        'gender_policy'     => GenderPolicy::class,
    ];

    public function getPriceRupiahAttribute(): ?string
    {
        $cents = $this->effectivePriceCents(BillingPeriod::MONTHLY->value);
        if ($cents === null) {
            return null;
        }
        $amount = (int) round(((int) $cents) / 100);

        return 'Rp ' . number_format($amount, 0, ',', '.');
    }

    public function effectivePrices(): array
    {
        $typePrices = (array) ($this->relationLoaded('type') && $this->type ? ($this->type->prices ?? []) : (\App\Models\RoomType::query()->where('id', $this->room_type_id)->value('prices') ?? []));

        $roomOverrides = (array) ($this->price_overrides ?? []);

        $get = function (string $k) use ($roomOverrides, $typePrices): ?int {
            $v = $roomOverrides[$k] ?? $typePrices[$k] ?? null;

            return $v === null ? null : (int) $v;
        };

        return [
            'daily'   => $get('daily'),
            'weekly'  => $get('weekly'),
            'monthly' => $get('monthly'),
        ];
    }

    public function effectiveDeposits(): array
    {
        $typeDeps = (array) ($this->relationLoaded('type') && $this->type ? ($this->type->deposits ?? []) : (\App\Models\RoomType::query()->where('id', $this->room_type_id)->value('deposits') ?? []));

        $roomOverrides = (array) ($this->deposit_overrides ?? []);

        $get = function (string $k) use ($roomOverrides, $typeDeps): ?int {
            $v = $roomOverrides[$k] ?? $typeDeps[$k] ?? null;

            return $v === null ? null : (int) $v;
        };

        return [
            'daily'   => $get('daily'),
            'weekly'  => $get('weekly'),
            'monthly' => $get('monthly'),
        ];
    }

    public function effectivePriceCents(string $period): ?int
    {
        $key = match (strtolower($period)) {
            'daily'  => 'daily',
            'weekly' => 'weekly',
            default  => 'monthly',
        };
        $all = $this->effectivePrices();

        return $all[$key] ?? null;
    }

    public function effectiveDepositCents(string $period): ?int
    {
        $key = match (strtolower($period)) {
            'daily'  => 'daily',
            'weekly' => 'weekly',
            default  => 'monthly',
        };
        $all = $this->effectiveDeposits();

        return $all[$key] ?? null;
    }

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function floor(): BelongsTo
    {
        return $this->belongsTo(Floor::class);
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(RoomType::class, 'room_type_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(RoomPhoto::class);
    }

    public function amenities(): BelongsToMany
    {
        return $this->belongsToMany(Amenity::class)->withTimestamps();
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function holdingContracts(): HasMany
    {
        return $this->hasMany(Contract::class)
            ->whereIn('status', [
                ContractStatus::PENDING_PAYMENT->value,
                ContractStatus::BOOKED->value,
                ContractStatus::ACTIVE->value,
            ]);
    }
}
