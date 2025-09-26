<?php

namespace App\Services\Contracts;

use App\Models\User;

interface MenuServiceInterface
{
    /**
     * Build sidebar menu groups filtered by the given user permissions.
     *
     * @param User|null $user
     * @return array<int, array{id:string,label:string,items:array<int, array{label:string,href:?string,name:?string,icon:?string,children:?array<int, array{label:string,href:?string,name:?string,icon:?string}>}>}>
     */
    public function forUser(?User $user): array;

    /**
     * Build localized public menu tree for a placement, cached per-locale.
     *
     * @param string|null $locale
     * @param string $placement One of: 'header', 'footer'
     * @return array<int, array{label:string,href:?string,icon:?string,target:?string,rel:?string,children:?array}>
     */
    public function publicForLocale(?string $locale = null, string $placement = 'header'): array;
}
