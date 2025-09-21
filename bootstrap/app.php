<?php

use Illuminate\Foundation\Application;
use App\Http\Middleware\HandleInertiaRequests;
use Spatie\Permission\Middleware\RoleMiddleware;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Illuminate\Http\Request;
use Illuminate\Foundation\Configuration\Middleware;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use App\Providers\RateLimitServiceProvider;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
    })
    ->withProviders([
        RateLimitServiceProvider::class,
    ])
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($e instanceof ThrottleRequestsException || $e instanceof TooManyRequestsHttpException) {
                $headers = (array) $e->getHeaders();
                $retry   = $headers['Retry-After'] ?? null;
                $msg     = $retry ? __('Terlalu banyak permintaan. Coba lagi dalam :sec detik.', ['sec' => $retry]) : __('Terlalu banyak permintaan. Coba lagi beberapa saat lagi.');

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
