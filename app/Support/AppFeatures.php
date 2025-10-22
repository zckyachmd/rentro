<?php

namespace App\Support;

use App\Models\AppSetting;
use Illuminate\Support\Facades\Schema;

class AppFeatures
{
    /**
     * Determine if public pages/routes are enabled.
     * Centralized with safe DB guard and per-request memoization.
     */
    public static function publicEnabled(): bool
    {
        static $memo = null;
        if ($memo !== null) {
            return $memo;
        }
        try {
            // 1) Explicit config override wins (works with config caching)
            $cfg = config('app.public_enabled');
            if ($cfg !== null) {
                return $memo = filter_var($cfg, FILTER_VALIDATE_BOOLEAN);
            }

            // 2) DB-backed setting, default to true so public pages exist by default
            $default = true;
            $memo    = Schema::hasTable('app_settings')
                ? (bool) AppSetting::config('public.enabled', $default)
                : $default;
        } catch (\Throwable) {
            $memo = true;
        }

        return $memo;
    }
}
