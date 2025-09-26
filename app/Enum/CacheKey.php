<?php

namespace App\Enum;

enum CacheKey: string
{
    case MenuForUser    = 'menu_for_user';
    case AllRoles       = 'all_roles';
    case AllPermissions = 'all_permissions';
    case ZiggyForUser   = 'ziggy_for_user';
    case ZiggyUserBump  = 'ziggy_user_bump';

    /**
     * Build a cache key for a specific user id (or guest when null).
     */
    public function forUser(?int $userId): string
    {
        $suffix = $userId ? (string) $userId : 'guest';

        return $this->value . '_' . $suffix;
    }

    /**
     * Build a cache key for a specific user id with a signature suffix.
     */
    public function forUserWithSig(?int $userId, string $signature): string
    {
        $base = $this->forUser($userId);

        return $base . ':' . $signature;
    }
}
