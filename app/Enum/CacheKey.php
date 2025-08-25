<?php

namespace App\Enum;

enum CacheKey: string
{
    case MenuForUser = 'menu_for_user';

    /**
     * Build a cache key for a specific user id (or guest when null).
     */
    public function forUser(?int $userId): string
    {
        $suffix = $userId ? (string) $userId : 'guest';

        return $this->value . '_' . $suffix;
    }
}
