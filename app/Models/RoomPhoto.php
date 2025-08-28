<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_id',
        'path',
        'is_cover',
        'ordering',
    ];

    protected $casts = [
        'is_cover' => 'boolean',
        'ordering' => 'integer',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }
}
