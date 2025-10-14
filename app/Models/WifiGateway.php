<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WifiGateway extends Model
{
    protected $fillable = [
        'gw_id',
        'mac_address',
        'name',
        'site_id',
        'mgmt_ip',
        'sys_uptime',
        'sys_load',
        'meta',
        'last_ping_at',
    ];

    protected $casts = [
        'meta'         => 'array',
        'last_ping_at' => 'datetime',
        'sys_uptime'   => 'integer',
        'sys_load'     => 'float',
    ];

    public function sessions(): HasMany
    {
        return $this->hasMany(WifiSession::class, 'gateway_id');
    }

    public function scopeByGwId($q, string $gwId)
    {
        return $q->where('gw_id', $gwId);
    }
}
