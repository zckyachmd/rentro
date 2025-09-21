<?php

namespace App\Enum;

enum ContractStatus: string
{
    case PENDING_PAYMENT = 'Pending Payment';
    case OVERDUE         = 'Overdue';
    case CANCELLED       = 'Cancelled';
    case BOOKED          = 'Booked';
    case ACTIVE          = 'Active';
    case COMPLETED       = 'Completed';

    public static function options(): array
    {
        return collect(self::cases())
            ->map(fn (self $s) => ['value' => $s->value, 'label' => $s->value])
            ->values()
            ->all();
    }
}
