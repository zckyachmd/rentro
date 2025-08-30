<?php

namespace App\Models;

use App\Models\Concerns\HasAudit;
use App\Models\Concerns\HasSnowflakeId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoomType extends Model
{
    use HasFactory;
    use SoftDeletes;
    use HasAudit;
    use HasSnowflakeId;

    public $incrementing = false;
    protected $keyType   = 'int';

    protected $fillable = [
        'name',
        'slug',
        'capacity',
        'size_m2',
        'price_cents',
        'deposit_cents',
        'description',
        'is_active',
    ];

    protected $casts = [
        'capacity'      => 'integer',
        'size_m2'       => 'decimal:2',
        'price_cents'   => 'integer',
        'deposit_cents' => 'integer',
        'is_active'     => 'boolean',
    ];

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
}
