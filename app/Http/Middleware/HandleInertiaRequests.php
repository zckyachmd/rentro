<?php

namespace App\Http\Middleware;

use App\Enum\Locale as AppLocale;
use App\Services\Contracts\MenuServiceInterface;
use App\Services\Contracts\ZiggyServiceInterface;
use Illuminate\Http\Request;
use Inertia\Middleware;

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
     * @param ZiggyServiceInterface $ziggy
     */
    public function __construct(
        protected MenuServiceInterface $menus,
        protected ZiggyServiceInterface $ziggy,
    ) {
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
        $supportedLocales = array_map(fn (AppLocale $c) => $c->value, AppLocale::cases());

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
            'menus' => function () use ($request) {
                return $this->menus->forUser($request->user());
            },
            'publicMenus'       => fn () => $this->menus->publicForLocale((string) app()->getLocale(), 'header'),
            'publicFooterMenus' => fn () => $this->menus->publicForLocale((string) app()->getLocale(), 'footer'),
            'ziggy'             => fn () => $this->ziggy->forRequest($request),
            'alert'             => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info'    => fn () => $request->session()->get('info'),
                'message' => fn () => $request->session()->get('message'),
                'data'    => fn () => $request->session()->get('data'),
            ],
            'preferences' => [
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
                'locale' => function () use ($request, $supportedLocales) {
                    $supported = $supportedLocales;
                    $user      = $request->user();
                    $fromUser  = null;
                    if ($user) {
                        try {
                            $prefs = (array) ($user->preferences ?? []);
                            $cand  = $prefs['locale'] ?? null;
                            if (is_string($cand) && in_array($cand, $supported, true)) {
                                $fromUser = $cand;
                            }
                        } catch (\Throwable) {
                            // ignore
                        }
                    }
                    $fromCookie = (string) $request->cookie('locale', '');
                    $locale     = $fromUser ?? (in_array($fromCookie, $supported, true) ? $fromCookie : null);

                    return $locale ?? app()->getLocale();
                },
            ],
        ];
    }
}
