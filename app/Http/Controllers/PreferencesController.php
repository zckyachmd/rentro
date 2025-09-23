<?php

namespace App\Http\Controllers;

use App\Http\Requests\Settings\UpdateLocalePreferenceRequest;
use App\Http\Requests\Settings\UpdateThemePreferenceRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;

class PreferencesController extends Controller
{
    public function updateTheme(UpdateThemePreferenceRequest $request): Response|RedirectResponse
    {
        $theme = $request->theme();
        // Normalize enum/string to plain string for persistence & cookie
        if ($theme instanceof \BackedEnum) {
            $theme = $theme->value;
        } elseif (!is_string($theme)) {
            $theme = (string) $theme;
        }

        if ($request->user()) {
            try {
                $user              = $request->user();
                $prefs             = (array) ($user->preferences ?? []);
                $prefs['theme']    = $theme;
                $user->preferences = $prefs;
                $user->save();
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
            sameSite: 'lax',
        );

        if ($request->expectsJson() || $request->wantsJson() || $request->headers->has('X-Inertia')) {
            return response()->noContent()->withCookie($cookie);
        }

        return redirect($request->validated('redirect') ?? url()->previous() ?? '/')->withCookie($cookie);
    }

    public function updateLocale(UpdateLocalePreferenceRequest $request): Response|RedirectResponse
    {
        $locale = $request->locale();
        // Normalize enum/string to plain string for persistence & cookie
        if ($locale instanceof \BackedEnum) {
            $locale = $locale->value;
        } elseif (!is_string($locale)) {
            $locale = (string) $locale;
        }

        if ($request->user()) {
            try {
                $user              = $request->user();
                $prefs             = (array) ($user->preferences ?? []);
                $prefs['locale']   = $locale;
                $user->preferences = $prefs;
                $user->save();
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

        if ($request->expectsJson() || $request->wantsJson() || $request->headers->has('X-Inertia')) {
            return response()->noContent()->withCookie($cookie);
        }

        return redirect($request->validated('redirect') ?? url()->previous() ?? '/')->withCookie($cookie);
    }
}
