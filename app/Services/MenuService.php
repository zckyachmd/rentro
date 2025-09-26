<?php

namespace App\Services;

use App\Enum\CacheKey;
use App\Models\Menu;
use App\Models\MenuGroup;
use App\Models\PublicMenu;
use App\Models\User;
use App\Services\Contracts\MenuServiceInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class MenuService implements MenuServiceInterface
{
    /**
     * @param User|null $user
     * @return array<int, array<string, mixed>>
     */
    public function forUser(?User $user): array
    {
        $cacheKey = CacheKey::MenuForUser->forUser($user?->id);

        return Cache::remember($cacheKey, 3600, function () use ($user) {
            /** @var Collection<int, MenuGroup> $groups */
            $groups = MenuGroup::with([
                'menus' => function ($q) {
                    $q->whereNull('parent_id')->where('is_active', true)->orderBy('sort_order');
                },
                'menus.children' => function ($q) {
                    $q->where('is_active', true)->orderBy('sort_order');
                },
            ])->where('is_active', true)->orderBy('sort_order')->get();

            /** @return array{id:string,label:string,items:array<int, array{label:string,href:?string,icon:?string,children:?array<int, array{label:string,href:?string,icon:?string}>}>} */
            $mapGroup = function (MenuGroup $g) use ($user): array {
                /** @var Collection<int, Menu> $menus */
                $menus = $g->menus;

                /** @return array{label:string,href:?string,icon:?string,children:?array<int, array{label:string,href:?string,icon:?string}>} */
                $mapMenu = function (Menu $m) use ($user): ?array {
                    /** @var Collection<int, Menu> $childrenCol */
                    $childrenCol = $m->children;

                    /** @return bool */
                    $filterChild = function (Menu $c) use ($user): bool {
                        return $this->visibleForUser($c, $user);
                    };

                    $childrenArr = $childrenCol
                        ->filter($filterChild)
                        ->map(function (Menu $c): array {
                            return [
                                'label' => $c->label,
                                'href'  => $c->href,
                                'icon'  => $c->icon,
                            ];
                        })
                        ->values()
                        ->all();

                    $hasHref = !empty($m->href) && $m->href !== '#';
                    if (!$hasHref && empty($childrenArr)) {
                        return null;
                    }

                    return [
                        'label'    => $m->label,
                        'href'     => $m->href,
                        'icon'     => $m->icon,
                        'children' => !empty($childrenArr) ? $childrenArr : null,
                    ];
                };

                /** @return bool */
                $filterMenu = function (Menu $m) use ($user): bool {
                    return $this->visibleForUser($m, $user);
                };

                $itemsArr = $menus
                    ->filter($filterMenu)
                    ->map($mapMenu)
                    ->filter()
                    ->values()
                    ->all();

                return [
                    'id'    => $g->key,
                    'label' => $g->label,
                    'items' => $itemsArr,
                ];
            };

            return $groups
                ->map($mapGroup)
                ->filter(fn (array $grp) => !empty($grp['items']))
                ->values()
                ->all();
        });
    }

    /**
     * Determine if a menu item is visible to a user based on roles/permissions.
     */
    protected function visibleForUser(Menu $menu, ?User $user): bool
    {
        $allowedRoles   = (array) ($menu->allowed_roles ?? []);
        $excludedRoles  = (array) ($menu->excluded_roles ?? []);
        $permissionName = $menu->permission_name;

        if (!empty($excludedRoles) && $user && $user->hasAnyRole($excludedRoles)) {
            return false;
        }

        if (!empty($allowedRoles)) {
            if (!$user || !$user->hasAnyRole($allowedRoles)) {
                return false;
            }
        }

        if (!empty($permissionName)) {
            if (!$user || !$user->can($permissionName)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Build localized public menu tree, cached per-locale.
     *
     * @return array<int, array{label:string,href:?string,icon:?string,target:?string,rel:?string,children:?array}>
     */
    public function publicForLocale(?string $locale = null, string $placement = 'header'): array
    {
        $loc = $this->normalizeLocale($locale ?? (string) app()->getLocale());
        $key = CacheKey::PublicMenuForLocale->forLocale($loc . ':' . $placement);

        return Cache::remember($key, 3600, function () use ($loc, $placement) {
            $all = PublicMenu::query()
                ->where('is_active', true)
                ->where('placement', $placement)
                ->orderBy('sort')
                ->orderBy('id')
                ->get([
                    'id', 'parent_id', 'placement', 'label', 'label_i18n', 'href', 'icon', 'target', 'rel', 'sort',
                ]);

            $byParent = [];
            foreach ($all as $item) {
                $byParent[$item->parent_id ?? 0][] = $item;
            }

            $resolveLabel = function ($rawLabel, $rawI18n) use ($loc) {
                try {
                    $mapRaw = is_string($rawI18n) ? $rawI18n : json_encode($rawI18n ?? [], JSON_UNESCAPED_UNICODE);
                    $map    = (array) json_decode($mapRaw ?: '[]', true);
                    $full   = $map[$loc] ?? null;
                    if (is_string($full) && $full !== '') {
                        return $full;
                    }
                    $base  = explode('-', $loc)[0] ?? $loc;
                    $baseV = $map[$base] ?? null;
                    if (is_string($baseV) && $baseV !== '') {
                        return $baseV;
                    }
                } catch (\Throwable) {
                    // ignore;
                }

                return is_string($rawLabel) ? $rawLabel : null;
            };

            $toArr = function (PublicMenu $m) use (&$toArr, &$byParent, $resolveLabel) {
                $children = $byParent[$m->id] ?? [];

                return [
                    'label'    => $resolveLabel($m->getRawOriginal('label'), $m->getRawOriginal('label_i18n')),
                    'href'     => $m->href ?: null,
                    'icon'     => $m->icon ?: null,
                    'target'   => $m->target ?: null,
                    'rel'      => $m->rel ?: null,
                    'children' => array_map(
                        fn (PublicMenu $c) => $toArr($c),
                        $children,
                    ) ?: null,
                ];
            };

            $roots = $byParent[0] ?? [];
            if ($placement === 'footer') {
                $roots = array_slice($roots, 0, 2);
            }

            return array_map(fn (PublicMenu $r) => $toArr($r), $roots);
        });
    }

    private function normalizeLocale(string $locale): string
    {
        $l = strtolower(trim($locale));

        return explode('-', $l)[0] ?: $l;
    }
}
