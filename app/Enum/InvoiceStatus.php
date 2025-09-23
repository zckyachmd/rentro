<?php

namespace App\Enum;

enum InvoiceStatus: string
{
    case PENDING   = 'pending';
    case OVERDUE   = 'overdue';
    case PAID      = 'paid';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return __('enum.invoice.status.' . strtolower($this->name));
    }
}
