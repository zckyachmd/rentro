<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Session extends Model
{
    use LogsActivity;

    protected $table      = 'sessions';
    protected $primaryKey = 'id';
    public $incrementing  = false;
    public $timestamps    = false;

    protected static $recordEvents = ['created', 'updated'];

    protected $casts = [
        'last_activity' => 'integer',
    ];

    /**
     * Get the activity log options for the model.
     *
     * @return LogOptions
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['user_id', 'ip_address', 'user_agent', 'last_activity'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
