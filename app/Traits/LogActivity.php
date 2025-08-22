<?php

namespace App\Traits;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Contracts\Activity as ActivityContract;
use Spatie\Activitylog\Facades\Activity;
use Spatie\Activitylog\Models\Activity as ActivityModel;

trait LogActivity
{
    protected function logEvent(
        string $event,
        mixed $causer = null,
        array $properties = [],
        ?Model $subject = null,
        ?string $description = null,
        ?string $logName = null,
    ): ?ActivityContract {
        $logger = Activity::tap(function (ActivityModel $activity) use ($event) {
            $activity->event = $event;
        });

        if ($logName) {
            $logger = $logger->useLog($logName);
        }

        if ($causer instanceof Authenticatable || $causer) {
            $logger = $logger->causedBy($causer);
        } elseif (request()->user()) {
            $logger = $logger->causedBy(request()->user());
        }

        if ($subject) {
            $logger = $logger->performedOn($subject);
        }

        return $logger
            ->withProperties($this->formatEventProperties($event, $properties))
            ->event($event)
            ->log($description ?? ucfirst(str_replace('_', ' ', $event)));
    }

    protected function formatEventProperties(string $event, array $properties = []): array
    {
        $req = request();

        return collect($properties)
            ->merge([
                'event'      => $event,
                'ip'         => $req->ip(),
                'user_agent' => (string) $req->userAgent(),
                'url'        => $req->fullUrl(),
            ])
            ->toArray();
    }

    protected function logAuth(string $event, ?Authenticatable $user = null, array $extra = []): ?ActivityContract
    {
        $descriptions = [
            'login'                        => 'User login',
            'logout'                       => 'User logout',
            'registered'                   => 'User registered',
            'email_verification_link_sent' => 'Verification link sent',
            'email_verified'               => 'Email verified',
            'password_reset_link_sent'     => 'Password reset link requested',
            'password_reset'               => 'Password reset',
            'password_updated'             => 'Password updated',
            'password_confirmed'           => 'Password confirmed',
        ];

        return $this->logEvent(
            event: $event,
            causer: $user,
            properties: $extra,
            subject: null,
            description: $descriptions[$event] ?? ("Auth action: {$event}"),
            logName: 'auth',
        );
    }

    protected function logModel(string $event, Model $subject, array $properties = [], ?string $description = null, ?string $logName = 'model'): ?ActivityContract
    {
        return $this->logEvent(
            event: $event,
            subject: $subject,
            properties: $properties,
            description: $description,
            logName: $logName,
        );
    }
}
