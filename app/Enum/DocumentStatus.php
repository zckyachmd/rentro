<?php

namespace App\Enum;

enum DocumentStatus: string
{
    case PENDING  = 'Pending';
    case APPROVED = 'Approved';
    case REJECTED = 'Rejected';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
