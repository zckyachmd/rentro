<?php

namespace App\Models;

use App\Models\Concerns\HasAudit;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoomType extends Model
{
    use HasFactory;
    use SoftDeletes;
    use HasAudit;

    protected $fillable = [
        'name',
        'slug',
        'capacity',
        'size_m2',
        'shared_bathroom',
        'description',
        'is_active',
    ];

    protected $casts = [
        'capacity'        => 'integer',
        'size_m2'         => 'decimal:2',
        'shared_bathroom' => 'boolean',
        'is_active'       => 'boolean',
    ];

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
}
