<?php

namespace App\Enum;

enum ContractStatus: string
{
    case PENDING_PAYMENT = 'pending_payment';
    case OVERDUE         = 'overdue';
    case CANCELLED       = 'cancelled';
    case BOOKED          = 'booked';
    case ACTIVE          = 'active';
    case COMPLETED       = 'completed';

    public function label(): string
    {
        return __('enum.contract.status.' . strtolower($this->name));
    }

    public static function options(): array
    {
        return collect(self::cases())
            ->map(fn (self $s) => ['value' => $s->value, 'label' => $s->label()])
            ->values()
            ->all();
    }
}
