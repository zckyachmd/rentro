<?php

namespace App\Enum;

enum Gender: string
{
    case MALE   = 'male';
    case FEMALE = 'female';
    case OTHER  = 'other';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
