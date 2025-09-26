<?php

namespace App\Models;

use App\Models\Concerns\HasAudit;
use App\Models\Concerns\HasSnowflakeId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Room> $rooms
 */
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
        'prices',
        'deposits',
        'description',
        'is_active',
    ];

    protected $casts = [
        'capacity'  => 'integer',
        'prices'    => 'array',
        'deposits'  => 'array',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $model): void {
            $slug = (string) ($model->slug ?? '');
            if ($slug !== '') {
                $model->slug = Str::slug($slug);
            } elseif (!empty($model->name)) {
                $model->slug = Str::slug((string) $model->name);
            }
        });
    }

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
}
