<?php

namespace App\Listeners;

use App\Enum\CacheKey;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\Cache;

class ClearMenuCacheOnAuth
{
    /**
     * Register the listeners for the subscriber.
     */
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(Login::class, [self::class, 'onLogin']);
        $events->listen(Logout::class, [self::class, 'onLogout']);
    }

    public function onLogin(Login $event): void
    {
        $this->forgetForUserId(self::userId($event->user));
    }

    public function onLogout(Logout $event): void
    {
        $this->forgetForUserId(self::userId($event->user));
    }

    private function forgetForUserId(?int $userId): void
    {
        try {
            $key = CacheKey::MenuForUser->forUser($userId);
            Cache::forget($key);
            if ($userId) {
                // Bump Ziggy cache namespace for this user
                try {
                    Cache::increment(CacheKey::ZiggyUserBump->forUser($userId));
                } catch (\Throwable) {
                    // ignore cache errors
                }
            }
        } catch (\Throwable) {
            // ignore cache errors
        }
    }

    private static function userId(mixed $user): ?int
    {
        try {
            // Eloquent Authenticatable
            if (is_object($user)) {
                $id = $user->id ?? (method_exists($user, 'getKey') ? $user->getKey() : null);
                if (is_int($id)) {
                    return $id;
                }
                if (is_string($id) && ctype_digit($id)) {
                    return (int) $id;
                }
            }
        } catch (\Throwable) {
        }

        return null;
    }
}
