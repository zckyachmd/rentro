<?php

namespace App\Enum;

enum DocumentStatus: string
{
    case PENDING  = 'pending';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';

    public function label(): string
    {
        return __('enum.document.status.' . strtolower($this->name));
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
