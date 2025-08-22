<?php

namespace App\Enum;

enum AddressLabel: string
{
    case HOME           = 'Rumah';
    case OFFICE         = 'Kantor';
    case CAMPUS         = 'Kampus';
    case APARTMENT      = 'Apartemen';
    case BOARDING_HOUSE = 'Kost';
    case PARENT_HOUSE   = 'Rumah Orang Tua';
    case OTHER          = 'Lainnya';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
