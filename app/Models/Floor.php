<?php

namespace App\Models;

use App\Models\Concerns\HasAudit;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property-read Building|null $building
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Room> $rooms
 */
class Floor extends Model
{
    use HasFactory;
    use SoftDeletes;
    use HasAudit;

    protected $fillable = [
        'building_id',
        'level',
        'name',
    ];

    public function building(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function rooms(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Room::class);
    }
}
