<?php

namespace App\Enum;

enum Gender: string
{
    case MALE   = 'male';
    case FEMALE = 'female';

    public function label(): string
    {
        return __('enum.gender.' . strtolower($this->name));
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
