<?php

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Request as SymfonyRequest;
use App\Console\Commands\SeedCore;
use App\Http\Middleware\SetLocale;
use App\Console\Commands\SeedSample;
use App\Http\Middleware\PortalAccess;
use App\Console\Commands\MenuNormalizePermissions;
use Illuminate\Foundation\Application;
use App\Http\Middleware\TrustedGateway;
use App\Providers\RateLimitServiceProvider;
use App\Http\Middleware\HandleInertiaRequests;
use Spatie\Permission\Middleware\RoleMiddleware;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withCommands([
        SeedCore::class,
        SeedSample::class,
    ])
    ->withMiddleware(function (Middleware $middleware) {
        // Trust proxies & hosts for reverse proxy / Cloudflare setups
        // Read from env if provided; fallback to trust all proxies and any host pattern
        $trustedProxies = env('TRUSTED_PROXIES'); // comma-separated or "*"
        $trustedHosts   = env('TRUSTED_HOSTS');   // pipe or comma-separated regex patterns

        if ($trustedProxies !== null && $trustedProxies !== '') {
            $list = array_values(array_filter(array_map('trim', preg_split('/[\s,]+/', (string) $trustedProxies))));
            $middleware->trustProxies(at: $list);
        } else {
            // Default: trust all inside containerized / ingress environments
            $middleware->trustProxies(at: ['*']);
        }

        // Forwarded headers to honor scheme/host/port from proxy
        $middleware->trustProxies(headers: (
            SymfonyRequest::HEADER_X_FORWARDED_FOR
            | SymfonyRequest::HEADER_X_FORWARDED_HOST
            | SymfonyRequest::HEADER_X_FORWARDED_PORT
            | SymfonyRequest::HEADER_X_FORWARDED_PROTO
            | SymfonyRequest::HEADER_X_FORWARDED_PREFIX
        ));

        if ($trustedHosts !== null && $trustedHosts !== '') {
            // Support comma or pipe separated host regexes
            $patterns = array_values(array_filter(array_map('trim', preg_split('/[\s,|]+/', (string) $trustedHosts))));
            $middleware->trustHosts(at: $patterns);
        } else {
            // Default: accept any host (suitable for debug/tunnel)
            $middleware->trustHosts(at: ['^.*$']);
        }
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'trusted.gateway' => TrustedGateway::class,
            'portal.access' => PortalAccess::class,
        ]);

        $middleware->web(append: [
            SetLocale::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->encryptCookies(except: ['sidebar_state', 'theme', 'locale']);
    })
    ->withProviders([
        RateLimitServiceProvider::class,
    ])
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($e instanceof ThrottleRequestsException || $e instanceof TooManyRequestsHttpException) {
                $headers = (array) $e->getHeaders();
                $retry   = $headers['Retry-After'] ?? null;
                $msg     = $retry ? __('system.throttle.retry', ['sec' => $retry]) : __('system.throttle.soon');

                if ($request->header('X-Inertia')) {
                    $response = redirect()->back()->withErrors(['message' => $msg])->with('error', $msg);
                    $response->setStatusCode(303);
                    return $response;
                }

                if ($request->expectsJson()) {
                    return response()->json(['message' => $msg], 429, $headers);
                }

                return redirect()->back()->with('error', $msg);
            }
            return null;
        });
    })->create();
