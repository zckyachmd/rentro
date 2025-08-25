<?php

namespace App\Enum;

enum Gender: string
{
    case MALE   = 'Male';
    case FEMALE = 'Female';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
