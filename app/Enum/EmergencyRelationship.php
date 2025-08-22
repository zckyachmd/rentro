<?php

namespace App\Enum;

enum EmergencyRelationship: string
{
    case PARENT    = 'Orang Tua';
    case SIBLING   = 'Saudara Kandung';
    case RELATIVE  = 'Keluarga Lain';
    case SPOUSE    = 'Pasangan';
    case FRIEND    = 'Teman Dekat';
    case GUARDIAN  = 'Wali';
    case ROOMMATE  = 'Teman Sekamar';
    case COLLEAGUE = 'Rekan Kerja';
    case NEIGHBOR  = 'Tetangga';
    case OTHER     = 'Lainnya';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
