<?php

namespace App\Models;

use App\Enum\TestimonyStatus;
use App\Models\Concerns\HasAudit;
use App\Models\Concerns\HasSnowflakeId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Testimony extends Model
{
    use HasFactory;
    use SoftDeletes;
    use HasAudit;
    use HasSnowflakeId;

    public $incrementing = false;
    protected $keyType   = 'int';

    protected $fillable = [
        'user_id',
        'content_original',
        'content_curated',
        'is_anonymous',
        'occupation',
        'status',
        'curated_by',
        'curated_at',
        'published_at',
    ];

    protected $casts = [
        'status'       => TestimonyStatus::class,
        'is_anonymous' => 'boolean',
        'curated_at'   => 'datetime',
        'published_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function curator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'curated_by');
    }
}
