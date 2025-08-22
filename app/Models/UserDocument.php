<?php

namespace App\Models;

use App\Models\Concerns\HasAudit;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDocument extends Model
{
    use HasFactory;
    use HasAudit;

    protected $fillable = [
        'user_id',
        'type',
        'number',
        'file_path',
        'issued_at',
        'expires_at',
        'status',
        'verified_by',
        'verified_at',
        'notes',
    ];

    protected $casts = [
        'issued_at'   => 'date',
        'expires_at'  => 'date',
        'verified_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
