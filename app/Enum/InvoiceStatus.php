<?php

namespace App\Enum;

enum InvoiceStatus: string
{
    case PENDING   = 'Pending';
    case OVERDUE   = 'Overdue';
    case PAID      = 'Paid';
    case CANCELLED = 'Cancelled';
}
