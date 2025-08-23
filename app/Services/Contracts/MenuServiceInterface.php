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
}
