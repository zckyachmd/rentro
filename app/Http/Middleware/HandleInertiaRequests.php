<?php

namespace App\Http\Middleware;

use App\Services\Contracts\MenuServiceInterface;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Create a new middleware instance.
     *
     * @param MenuServiceInterface $menus
     */
    public function __construct(protected MenuServiceInterface $menus)
    {
    }

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => (function () use ($request) {
                $user = $request->user();

                if (!$user) {
                    return ['user' => null];
                }

                $base = $user->append('avatar_url')->only([
                    'id',
                    'name',
                    'username',
                    'email',
                    'phone',
                    'avatar_url',
                ]);

                $roles       = $user->getRoleNames();
                $permissions = $user->getAllPermissions()->pluck('name');

                return [
                    'user' => array_merge($base, [
                        'roles'       => $roles,
                        'permissions' => $permissions,
                    ]),
                ];
            })(),
            'menuGroups' => function () use ($request) {
                return $this->menus->forUser($request->user());
            },
            'ziggy' => fn () => [
                ...(new Ziggy())->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
