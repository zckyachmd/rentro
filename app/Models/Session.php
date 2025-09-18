<?php

namespace App\Models;

use App\Models\Concerns\HasAudit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property-read User|null $user
 */
class Session extends Model
{
    use HasAudit;

    protected $table      = 'sessions';
    protected $primaryKey = 'id';
    public $incrementing  = false;
    public $timestamps    = false;

    protected $casts = [
        'last_activity' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
