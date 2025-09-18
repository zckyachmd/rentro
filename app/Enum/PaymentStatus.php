<?php

namespace App\Enum;

enum PaymentStatus: string
{
    case REVIEW    = 'Review';
    case PENDING   = 'Pending';
    case COMPLETED = 'Completed';
    case FAILED    = 'Failed';
    case CANCELLED = 'Cancelled';
}
