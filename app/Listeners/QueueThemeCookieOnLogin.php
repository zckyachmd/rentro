<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Cookie;

class QueueThemeCookieOnLogin
{
    /**
     * Handle the event.
     */
    public function handle(Login $event): void
    {
        $user = $event->user;

        $theme = 'system';
        if ($user) {
            try {
                $prefs     = (array) ($user->preferences ?? []);
                $candidate = $prefs['theme'] ?? null;
                if (in_array($candidate, ['light', 'dark', 'system'], true)) {
                    $theme = $candidate;
                }
            } catch (\Throwable) {
                // ignore
            }
        }

        $cookie = cookie()->make(
            'theme',
            $theme,
            60 * 24 * 365,
            path: '/',
            domain: null,
            secure: (bool) config('session.secure', false),
            httpOnly: false,
            raw: false,
            sameSite: 'Lax',
        );

        Cookie::queue($cookie);
    }
}
