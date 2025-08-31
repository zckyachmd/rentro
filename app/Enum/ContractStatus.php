<?php

namespace App\Enum;

enum ContractStatus: string
{
    case DRAFT     = 'Draft';
    case ACTIVE    = 'Active';
    case COMPLETED = 'Completed';
    case CANCELLED = 'Cancelled';
}
