<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WifiCounter extends Model
{
    protected $fillable = ['session_id', 'ts', 'incoming', 'outgoing', 'uptime', 'raw'];

    protected $casts = [
        'ts'       => 'datetime',
        'incoming' => 'integer',
        'outgoing' => 'integer',
        'uptime'   => 'integer',
        'raw'      => 'array',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(WifiSession::class, 'session_id');
    }
}
