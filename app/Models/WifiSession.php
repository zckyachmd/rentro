<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WifiSession extends Model
{
    protected $fillable = [
        'user_id',
        'gateway_id',
        'policy_id',
        'mac',
        'ip',
        'token',
        'status',
        'started_at',
        'last_seen_at',
        'ended_at',
        'bytes_in',
        'bytes_out',
        'uptime',
        'ended_reason',
        'meta',
    ];

    protected $casts = [
        'started_at'   => 'datetime',
        'last_seen_at' => 'datetime',
        'ended_at'     => 'datetime',
        'bytes_in'     => 'integer',
        'bytes_out'    => 'integer',
        'uptime'       => 'integer',
        'meta'         => 'array',
    ];

    public const STATUS_AUTH    = 'auth';
    public const STATUS_BLOCKED = 'blocked';
    public const STATUS_REVOKED = 'revoked';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_PENDING = 'pending';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function gateway(): BelongsTo
    {
        return $this->belongsTo(WifiGateway::class, 'gateway_id');
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(WifiPolicy::class, 'policy_id');
    }

    public function counters(): HasMany
    {
        return $this->hasMany(WifiCounter::class, 'session_id');
    }

    public function scopeActive($q)
    {
        return $q->whereIn('status', [self::STATUS_AUTH, self::STATUS_PENDING]);
    }

    public function applyCounters(int $incoming, int $outgoing, ?int $uptime): void
    {
        $this->bytes_in  = max($this->bytes_in, $incoming);
        $this->bytes_out = max($this->bytes_out, $outgoing);
        if (!is_null($uptime)) {
            $this->uptime = max($this->uptime, $uptime);
        }
        $this->last_seen_at = now();
        $this->save();
    }

    public function revoke(string $reason = 'revoked'): void
    {
        $this->status       = self::STATUS_REVOKED;
        $this->ended_reason = $reason;
        $this->ended_at     = now();
        $this->save();
    }
}
