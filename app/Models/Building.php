<?php

namespace App\Models;

use App\Models\Concerns\HasAudit;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Floor> $floors
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Room> $rooms
 */
class Building extends Model
{
    use HasFactory;
    use SoftDeletes;
    use HasAudit;

    protected $fillable = [
        'name',
        'code',
        'address',
        'is_active',
    ];

    public function floors(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Floor::class);
    }

    public function rooms(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Room::class);
    }
}
