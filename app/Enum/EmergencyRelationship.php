<?php

namespace App\Enum;

enum EmergencyRelationship: string
{
    case PARENT    = 'parent';
    case SIBLING   = 'sibling';
    case RELATIVE  = 'relative';
    case SPOUSE    = 'spouse';
    case FRIEND    = 'friend';
    case GUARDIAN  = 'guardian';
    case ROOMMATE  = 'roommate';
    case COLLEAGUE = 'colleague';
    case NEIGHBOR  = 'neighbor';

    public function label(): string
    {
        return __('enum.emergency_relationship.' . strtolower($this->name));
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
