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

                $roles       = $user->getRoleNames()->values()->all();
                $permissions = $user->getAllPermissions()->pluck('name')->values()->all();

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
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info'    => fn () => $request->session()->get('info'),
                'message' => fn () => $request->session()->get('message'),
                'data'    => fn () => $request->session()->get('data'),
            ],
            'cb' => [
                'success' => fn () => $request->session()->get('success') ?? $request->session()->get('cb_success'),
                'error'   => fn () => $request->session()->get('error') ?? $request->session()->get('cb_error'),
                'data'    => fn () => $request->session()->get('data') ?? $request->session()->get('cb_data'),
            ],
            'appearance' => [
                'theme' => function () use ($request) {
                    $user          = $request->user();
                    $themeFromUser = null;
                    if ($user) {
                        try {
                            $prefs     = (array) ($user->preferences ?? []);
                            $candidate = $prefs['theme'] ?? null;
                            if (in_array($candidate, ['light', 'dark', 'system'], true)) {
                                $themeFromUser = $candidate;
                            }
                        } catch (\Throwable) {
                            // ignore
                        }
                    }

                    return $request->cookie('theme', $themeFromUser ?? 'system');
                },
            ],
        ];
    }
}
