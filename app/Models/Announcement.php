<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    protected $fillable = [
        'scope',
        'role_id',
        'title',
        'message',
        'action_url',
        'persist',
        'scheduled_at',
        'sent_at',
        'status',
        'created_by',
    ];

    protected $casts = [
        'persist'      => 'boolean',
        'scheduled_at' => 'datetime',
        'sent_at'      => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
