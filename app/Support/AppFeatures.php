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
            $memo = Schema::hasTable('app_settings')
                ? (bool) AppSetting::config('public.enabled', false)
                : false;
        } catch (\Throwable) {
            $memo = false;
        }

        return $memo;
    }
}
