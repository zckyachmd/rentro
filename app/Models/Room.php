<?php

namespace App\Models;

use App\Enum\BillingPeriod;
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
        'price_cents',
        'billing_period',
        'max_occupancy',
        'status',
        'gender_policy',
        'notes',
    ];

    protected $casts = [
        'size_m2'        => 'decimal:2',
        'price_cents'    => 'integer',
        'max_occupancy'  => 'integer',
        'status'         => RoomStatus::class,
        'gender_policy'  => GenderPolicy::class,
        'billing_period' => BillingPeriod::class,
    ];

    public function getPriceRupiahAttribute(): ?string
    {
        if ($this->price_cents === null) {
            return null;
        }

        $amount = (int) round(((int) $this->price_cents) / 100);

        return 'Rp ' . number_format($amount, 0, ',', '.');
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
}
