<?php

namespace App\Models;

use App\Models\Concerns\HasAttachments;
use App\Models\Concerns\HasAudit;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property-read User|null $user
 * @property-read User|null $verifier
 */
class UserDocument extends Model
{
    use HasFactory;
    use HasAudit;
    use HasAttachments;

    protected $fillable = [
        'user_id',
        'type',
        'number',
        'issued_at',
        'expires_at',
        'status',
        'verified_at',
        'notes',
    ];

    protected $casts = [
        'issued_at'   => 'date',
        'expires_at'  => 'date',
        'verified_at' => 'datetime',
        'attachments' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
