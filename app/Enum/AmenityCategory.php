<?php

namespace App\Enum;

enum AmenityCategory: string
{
    case ROOM     = 'room';
    case COMMUNAL = 'communal';

    public function label(): string
    {
        return __('enum.amenity_category.' . $this->value);
    }
}
