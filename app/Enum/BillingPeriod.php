<?php

namespace App\Enum;

enum BillingPeriod: string
{
    case DAILY   = 'daily';
    case WEEKLY  = 'weekly';
    case MONTHLY = 'monthly';
}
