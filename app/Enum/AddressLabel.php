<?php

namespace App\Enum;

enum AddressLabel: string
{
    case HOME           = 'home';
    case OFFICE         = 'office';
    case CAMPUS         = 'campus';
    case APARTMENT      = 'apartment';
    case BOARDING_HOUSE = 'boarding_house';
    case PARENT_HOUSE   = 'parent_house';
    case OTHER          = 'other';

    public function label(): string
    {
        return __('enum.address_label.' . strtolower($this->name));
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
