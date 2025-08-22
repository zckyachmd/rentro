<?php

namespace App\Enum;

enum DocumentType: string
{
    case KTP      = 'KTP';
    case SIM      = 'SIM';
    case PASSPORT = 'PASSPORT';
    case NPWP     = 'NPWP';
    case OTHER    = 'Lainnya';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
