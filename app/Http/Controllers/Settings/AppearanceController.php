<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateThemeRequest;

class AppearanceController extends Controller
{
    /**
     * Update theme preference.
     *
     * Accepts: theme = 'light' | 'dark' | 'system'
     * Source of truth: cookie (always) + DB when user logged in (optional).
     */
    public function update(UpdateThemeRequest $request)
    {
        $theme = (string) $request->validated('theme');

        if ($request->user()) {
            $user              = $request->user();
            $prefs             = (array) ($user->preferences ?? []);
            $prefs['theme']    = $theme;
            $user->preferences = $prefs;

            $user->save();
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

        if ($request->expectsJson() || $request->wantsJson() || $request->headers->has('X-Inertia')) {
            return response()->noContent()->withCookie($cookie);
        }

        return back()->withCookie($cookie);
    }
}
