<?php

namespace App\Enum;

enum PaymentMethod: string
{
    case CASH            = 'Cash';
    case VIRTUAL_ACCOUNT = 'VirtualAccount';
}
