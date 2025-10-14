<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WifiPolicy extends Model
{
    protected $fillable = [
        'name',
        'max_devices',
        'quota_bytes',
        'quota',
        'max_uptime_s',
        'schedule_json',
        'is_active',
        'meta',
    ];

    protected $casts = [
        'schedule_json' => 'array',
        'meta'          => 'array',
        'is_active'     => 'boolean',
        'max_devices'   => 'integer',
        'quota_bytes'   => 'integer',
        'quota'         => 'array',
        'max_uptime_s'  => 'integer',
    ];

    public function sessions(): HasMany
    {
        return $this->hasMany(WifiSession::class, 'policy_id');
    }
}
