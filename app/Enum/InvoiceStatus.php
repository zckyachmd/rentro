<?php

namespace App\Enum;

enum InvoiceStatus: string
{
    case PENDING   = 'Pending';
    case PAID      = 'Paid';
    case CANCELLED = 'Cancelled';
}
