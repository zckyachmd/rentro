<?php

namespace App\Enum;

enum ProrataCharging: string
{
    case FULL      = 'full';
    case FREE      = 'free';
    case THRESHOLD = 'threshold';

    public static function values(): array
    {
        return array_map(static fn (self $c) => $c->value, self::cases());
    }
}
