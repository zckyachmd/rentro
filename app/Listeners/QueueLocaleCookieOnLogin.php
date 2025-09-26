<?php

namespace App\Listeners;

use App\Enum\Locale as AppLocale;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Cookie;

class QueueLocaleCookieOnLogin
{
    /**
     * Handle the event.
     */
    public function handle(Login $event): void
    {
        $user = $event->user;

        $locale    = 'en';
        $supported = array_map(fn (AppLocale $c) => $c->value, AppLocale::cases());
        if ($user) {
            try {
                $prefs     = (array) ($user->preferences ?? []);
                $candidate = $prefs['locale'] ?? null;
                if (is_string($candidate) && in_array($candidate, $supported, true)) {
                    $locale = $candidate;
                }
            } catch (\Throwable) {
                // ignore
            }
        }

        $cookie = cookie()->make(
            'locale',
            $locale,
            60 * 24 * 365,
            path: '/',
            domain: null,
            secure: (bool) config('session.secure', false),
            httpOnly: false,
            raw: false,
            sameSite: 'lax',
        );

        Cookie::queue($cookie);
    }
}
