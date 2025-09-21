<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Room> $rooms
 */
class Amenity extends Model
{
    use HasFactory;

    public $timestamps = true;

    protected $fillable = [
        'name',
        'icon',
        'category',
    ];

    public function rooms()
    {
        return $this->belongsToMany(Room::class);
    }
}
