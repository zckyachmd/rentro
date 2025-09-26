<?php

namespace App\Models;

use App\Enum\PromotionScopeType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromotionScope extends Model
{
    use HasFactory;

    protected $fillable = [
        'promotion_id',
        'scope_type',
        'building_id',
        'floor_id',
        'room_type_id',
        'room_id',
    ];

    protected $casts = [
        'scope_type' => PromotionScopeType::class,
    ];

    public function promotion(): BelongsTo
    {
        return $this->belongsTo(Promotion::class);
    }

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function floor(): BelongsTo
    {
        return $this->belongsTo(Floor::class);
    }

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class, 'room_type_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
