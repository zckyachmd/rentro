<?php

use Illuminate\Http\Request;
use App\Console\Commands\SeedCore;
use App\Http\Middleware\SetLocale;
use App\Console\Commands\SeedDemo;
use App\Http\Middleware\PortalAccess;
use Illuminate\Foundation\Application;
use App\Http\Middleware\TrustedGateway;
use App\Providers\RouteServiceProvider;
use App\Providers\RateLimitServiceProvider;
use App\Http\Middleware\HandleInertiaRequests;
use Spatie\Permission\Middleware\RoleMiddleware;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Session\Middleware\AuthenticateSession;
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
        SeedDemo::class,
    ])
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->replace(\Illuminate\Http\Middleware\TrustProxies::class, \App\Http\Middleware\TrustProxies::class);
        $middleware->replace(\Illuminate\Http\Middleware\TrustHosts::class, \App\Http\Middleware\TrustHosts::class);
        $middleware->trustHosts();
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'trusted.gateway' => TrustedGateway::class,
            'portal.access' => PortalAccess::class,
        ]);

        $middleware->web(append: [
            AuthenticateSession::class,
            SetLocale::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->encryptCookies(except: ['sidebar_state', 'theme', 'locale']);
    })
    ->withProviders([
        RouteServiceProvider::class,
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
