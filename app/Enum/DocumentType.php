<?php

namespace App\Enum;

enum DocumentType: string
{
    case KTP      = 'ktp';
    case SIM      = 'sim';
    case PASSPORT = 'passport';
    case NPWP     = 'npwp';
    case OTHER    = 'other';

    public function label(): string
    {
        return __('enum.document.type.' . strtolower($this->name));
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
