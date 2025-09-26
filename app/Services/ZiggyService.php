<?php

namespace App\Services;

use App\Enum\CacheKey;
use App\Services\Contracts\ZiggyServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Tighten\Ziggy\Ziggy;

class ZiggyService implements ZiggyServiceInterface
{
    public function forRequest(Request $request): array
    {
        $user = $request->user();

        $roles = [];
        try {
            $roles = $user ? ($user->getRoleNames()->values()->all() ?? []) : [];
        } catch (\Throwable) {
            $roles = [];
        }
        sort($roles);

        $bump = 0;
        try {
            $bump = Cache::get(CacheKey::ZiggyUserBump->forUser($user?->id), 0);
        } catch (\Throwable) {
            $bump = 0;
        }
        $ver = (string) config('app.version', '0.0.0');
        $sig = sha1('appver:' . $ver . '|roles:' . implode(',', $roles) . '|b:' . $bump);

        $cacheKey = CacheKey::ZiggyForUser->forUserWithSig($user?->id, $sig);

        $payload = Cache::remember($cacheKey, 600, function () use ($user) {
            $ziggy  = (new Ziggy())->toArray();
            $router = app('router');

            $routes   = $ziggy['routes'] ?? [];
            $filtered = [];

            foreach ($routes as $name => $def) {
                $route = $router->getRoutes()->getByName($name);
                if (!$route) {
                    continue;
                }

                $mw = $route->gatherMiddleware();

                $requiresAuth     = false;
                $roles            = [];
                $permissions      = [];
                $abilities        = [];
                $roleOrPermission = [];

                foreach ($mw as $m) {
                    if ($m === 'auth' || str_starts_with($m, 'auth:')) {
                        $requiresAuth = true;
                    } elseif (str_starts_with($m, 'role:')) {
                        $roles = array_merge($roles, explode('|', substr($m, 5)));
                    } elseif (str_starts_with($m, 'permission:')) {
                        $permissions = array_merge($permissions, explode('|', substr($m, 11)));
                    } elseif (str_starts_with($m, 'role_or_permission:')) {
                        $requiresAuth     = true;
                        $args             = substr($m, strlen('role_or_permission:'));
                        $roleOrPermission = array_merge($roleOrPermission, explode('|', $args));
                    } elseif (str_starts_with($m, 'permission_or_role:')) {
                        $requiresAuth     = true;
                        $args             = substr($m, strlen('permission_or_role:'));
                        $roleOrPermission = array_merge($roleOrPermission, explode('|', $args));
                    } elseif (str_starts_with($m, 'can:')) {
                        $abilities = array_merge($abilities, explode('|', substr($m, 4)));
                    }
                }

                $allow = true;
                if (($requiresAuth || $roles || $permissions || $abilities) && !$user) {
                    $allow = false;
                }
                if ($allow && $user) {
                    if ($roles) {
                        $allow = method_exists($user, 'hasAnyRole') ? $user->hasAnyRole($roles) : $user->hasRole($roles);
                    }
                    if ($allow && $permissions) {
                        $allow = method_exists($user, 'hasAnyPermission') ? $user->hasAnyPermission($permissions) : true;
                    }
                    if ($allow && $roleOrPermission) {
                        $hasRole = method_exists($user, 'hasAnyRole') ? $user->hasAnyRole($roleOrPermission) : false;
                        $hasPerm = method_exists($user, 'hasAnyPermission') ? $user->hasAnyPermission($roleOrPermission) : false;
                        $allow   = $hasRole || $hasPerm;
                    }
                    if ($allow && $abilities) {
                        foreach ($abilities as $ability) {
                            if (!$user->can($ability)) {
                                $allow = false;
                                break;
                            }
                        }
                    }
                }

                if ($allow) {
                    $filtered[$name] = $def;
                }
            }

            $ziggy['routes'] = $filtered;

            return $ziggy;
        });

        $payload['location'] = $request->url();

        return $payload;
    }
}
