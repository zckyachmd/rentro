<?php

namespace App\Enum;

enum ContractStatus: string
{
    case PENDING_PAYMENT = 'Pending Payment';
    case BOOKED          = 'Booked';
    case PAID            = 'Paid';
    case ACTIVE          = 'Active';
    case OVERDUE         = 'Overdue';
    case COMPLETED       = 'Completed';
    case CANCELLED       = 'Cancelled';

    public static function options(): array
    {
        return collect(self::cases())
            ->map(fn (self $s) => ['value' => $s->value, 'label' => $s->value])
            ->all();
    }
}
