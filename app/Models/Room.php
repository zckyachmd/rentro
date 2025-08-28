<?php

namespace App\Models;

use App\Enum\BillingPeriod;
use App\Enum\GenderPolicy;
use App\Enum\RoomStatus;
use App\Models\Concerns\HasAudit;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Room extends Model
{
    use HasFactory;
    use SoftDeletes;
    use HasAudit;

    protected $fillable = [
        'building_id',
        'floor_id',
        'room_type_id',
        'number',
        'name',
        'size_m2',
        'price_cents',
        'price_currency',
        'deposit_cents',
        'billing_period',
        'max_occupancy',
        'is_shared',
        'status',
        'gender_policy',
        'notes',
    ];

    protected $casts = [
        'size_m2'        => 'decimal:2',
        'price_cents'    => 'integer',
        'deposit_cents'  => 'integer',
        'max_occupancy'  => 'integer',
        'is_shared'      => 'boolean',
        'status'         => RoomStatus::class,
        'gender_policy'  => GenderPolicy::class,
        'billing_period' => BillingPeriod::class,
    ];

    public function building()
    {
        return $this->belongsTo(Building::class);
    }

    public function floor()
    {
        return $this->belongsTo(Floor::class);
    }

    public function type()
    {
        return $this->belongsTo(RoomType::class, 'room_type_id');
    }

    public function amenities()
    {
        return $this->belongsToMany(Amenity::class)->withTimestamps();
    }

    public function photos()
    {
        return $this->hasMany(RoomPhoto::class)->orderBy('is_cover', 'desc')->orderBy('ordering');
    }
}
