<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Events\CallQueuedListener;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class RateLimitServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    protected function configureRateLimiting(): void
    {
        $makeKey = function (Request $request, string $name, ?string $id = null): string {
            $ip  = (string) $request->ip();
            $ua  = substr((string) $request->userAgent(), 0, 64);
            $sid = (string) ($id ?? strtolower((string) $request->input('email') ?: (string) $request->input('username')));
            $sid = $sid !== '' ? sha1($sid) : 'anon';

            return implode('|', [$name, $ip, $sid, $ua]);
        };

        // Auth flows
        RateLimiter::for('secure-login', function (Request $request) use ($makeKey) {
            return [
                Limit::perMinute(5)->by($makeKey($request, 'login')),
                Limit::perMinute(10)->by('ip:' . $request->ip()),
            ];
        });

        RateLimiter::for('secure-register', function (Request $request) use ($makeKey) {
            return [
                Limit::perMinutes(10, 3)->by($makeKey($request, 'register')),
                Limit::perDay(10)->by('ip:' . $request->ip()),
            ];
        });

        RateLimiter::for('secure-password-email', function (Request $request) use ($makeKey) {
            return [
                Limit::perMinutes(10, 3)->by($makeKey($request, 'pwd-email')),
                Limit::perDay(10)->by('ip:' . $request->ip()),
            ];
        });

        RateLimiter::for('secure-password-reset', function (Request $request) use ($makeKey) {
            return [
                Limit::perMinute(6)->by($makeKey($request, 'pwd-reset')),
                Limit::perMinute(12)->by('ip:' . $request->ip()),
            ];
        });

        RateLimiter::for('secure-password-confirm', function (Request $request) use ($makeKey) {
            return [
                Limit::perMinute(6)->by($makeKey($request, 'pwd-confirm')),
                Limit::perMinute(12)->by('ip:' . $request->ip()),
            ];
        });

        RateLimiter::for('secure-verification-send', function (Request $request) use ($makeKey) {
            return [
                Limit::perMinutes(10, 3)->by($makeKey($request, 'verify-send')),
                Limit::perDay(12)->by('ip:' . $request->ip()),
            ];
        });

        RateLimiter::for('secure-verify', function (Request $request) use ($makeKey) {
            $id = (string) $request->route('id');

            return [
                Limit::perMinute(6)->by($makeKey($request, 'verify', $id)),
                Limit::perMinute(12)->by('ip:' . $request->ip()),
            ];
        });

        // 2FA
        RateLimiter::for('secure-2fa-login', function (Request $request) use ($makeKey) {
            return [
                Limit::perMinute(6)->by($makeKey($request, '2fa-login')),
                Limit::perMinute(12)->by('ip:' . $request->ip()),
            ];
        });

        RateLimiter::for('secure-2fa-confirm', function (Request $request) use ($makeKey) {
            return [
                Limit::perMinute(6)->by($makeKey($request, '2fa-confirm')),
                Limit::perMinute(12)->by('ip:' . $request->ip()),
            ];
        });

        RateLimiter::for('secure-2fa-recovery', function (Request $request) use ($makeKey) {
            return [
                Limit::perMinutes(10, 3)->by($makeKey($request, '2fa-recovery')),
                Limit::perDay(10)->by('ip:' . $request->ip()),
            ];
        });

        // Sensitive actions
        RateLimiter::for('secure-sensitive', function (Request $request) use ($makeKey) {
            return [
                Limit::perMinute(6)->by($makeKey($request, 'sensitive')),
                Limit::perMinute(12)->by('ip:' . $request->ip()),
            ];
        });

        // Tenant payments/status
        RateLimiter::for('secure-tenant-pay', function (Request $request) use ($makeKey) {
            return [
                Limit::perMinute(6)->by($makeKey($request, 'tenant-pay', (string) $request->route('invoice'))),
                Limit::perMinute(12)->by('ip:' . $request->ip()),
            ];
        });

        // UI Preferences (theme, locale, etc.)
        RateLimiter::for('ui-preferences', function (Request $request) use ($makeKey) {
            return [
                Limit::perMinute(20)->by($makeKey($request, 'ui-pref')),
                Limit::perHour(200)->by('ip:' . $request->ip()),
            ];
        });
        RateLimiter::for('secure-tenant-status', function (Request $request) use ($makeKey) {
            return [
                Limit::perMinute(30)->by($makeKey($request, 'tenant-status', (string) $request->route('invoice'))),
                Limit::perMinute(60)->by('ip:' . $request->ip()),
            ];
        });

        // Queue listeners (global & per-contract caps)
        RateLimiter::for('listener:invoice-paid', function () {
            return [
                Limit::perMinute(300)->by('listener:invoice-paid:global'),
            ];
        });

        RateLimiter::for('listener:invoice-reopened', function () {
            return [
                Limit::perMinute(300)->by('listener:invoice-reopened:global'),
            ];
        });

        RateLimiter::for('listener:invoice-contract', function ($job) {
            $key = 'contract:unknown';
            try {
                if ($job instanceof CallQueuedListener) {
                    $ref  = new \ReflectionClass($job);
                    $prop = $ref->getProperty('data');
                    $prop->setAccessible(true);
                    $data = $prop->getValue($job);
                    if (is_array($data) && isset($data[0]) && is_object($data[0])) {
                        $event      = $data[0];
                        $contractId = null;
                        if (property_exists($event, 'invoice') && is_object($event->invoice)) {
                            $inv        = $event->invoice;
                            $contractId = $inv->contract_id ?? (method_exists($inv, 'getAttribute') ? $inv->getAttribute('contract_id') : null);
                        }
                        if (!empty($contractId)) {
                            $key = 'contract:' . (string) $contractId;
                        }
                    }
                }
            } catch (\Throwable) {
                // ignore
            }

            return [
                Limit::perMinute(60)->by('listener:invoice:' . $key),
            ];
        });
    }
}
