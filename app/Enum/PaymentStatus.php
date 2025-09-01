<?php

namespace App\Enum;

enum PaymentStatus: string
{
    case PENDING   = 'Pending';
    case COMPLETED = 'Completed';
    case FAILED    = 'Failed';
    case CANCELLED = 'Cancelled';
}
