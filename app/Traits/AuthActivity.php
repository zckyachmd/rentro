<?php

namespace App\Traits;

use Illuminate\Contracts\Auth\Authenticatable;
use Spatie\Activitylog\Facades\Activity;
use Spatie\Activitylog\Models\Activity as ActivityModel;

trait AuthActivity
{
    protected function logAuth(string $event, ?Authenticatable $user = null, array $extra = []): ?ActivityModel
    {
        $req = request();

        return Activity::causedBy($user ?? request()->user())
            ->withProperties(array_filter([
                'ip'         => $req->ip(),
                'user_agent' => $req->userAgent(),
                'url'        => $req->fullUrl(),
            ]) + $extra)
            ->event($event)
            ->log(match ($event) {
                'login'                        => 'User login',
                'logout'                       => 'User logout',
                'registered'                   => 'User registered',
                'email_verification_link_sent' => 'Verification link sent',
                'email_verified'               => 'Email verified',
                'password_reset_link_sent'     => 'Password reset link requested',
                'password_reset'               => 'Password reset',
                'password_updated'             => 'Password updated',
                'password_confirmed'           => 'Password confirmed',
                default                        => "Auth action: {$event}",
            });
    }
}
