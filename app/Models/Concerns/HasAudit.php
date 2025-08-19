<?php

namespace App\Models\Concerns;

use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

trait HasAudit
{
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName(class_basename($this))
            ->logOnly($this->auditableAttributes())
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected function auditableAttributes(): array
    {
        $fillable  = $this->fillable ?? [];
        $sensitive = [
            'password',
            'remember_token',
            'two_factor_secret',
            'two_factor_recovery_codes',
            'otp',
            'pin',
            'token',
        ];

        return array_values(array_diff($fillable, $sensitive));
    }

    public function tapActivity(\Spatie\Activitylog\Models\Activity $activity, string $eventName): void
    {
        $req = request();

        $props = collect($activity->properties ?? [])
            ->merge([
                'event'      => $eventName,
                'ip'         => $req?->ip(),
                'user_agent' => (string) $req?->userAgent(),
                'url'        => $req?->fullUrl(),
            ]);

        if (method_exists($this, 'auditLabel')) {
            $props->put('subject_label', $this->auditLabel());
        }

        $activity->properties = $props->toArray();

        $activity->description = $this->auditDescription($eventName);
    }

    protected function auditDescription(string $eventName): string
    {
        $subject = class_basename($this);
        $label   = method_exists($this, 'auditLabel') ? $this->auditLabel() : "#{$this->getKey()}";

        return match ($eventName) {
            'created' => "{$subject} {$label} dibuat",
            'updated' => "{$subject} {$label} diperbarui",
            'deleted' => "{$subject} {$label} dihapus",
            default   => "{$subject} {$label} {$eventName}",
        };
    }
}
