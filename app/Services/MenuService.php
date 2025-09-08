<?php

namespace App\Services;

use App\Enum\CacheKey;
use App\Models\Menu;
use App\Models\MenuGroup;
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
}
