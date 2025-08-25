<?php

namespace App\Enum;

enum RoleName: string
{
    case SUPER_ADMIN = 'Super Admin';
    case OWNER       = 'Owner';
    case MANAGER     = 'Manager';
    case TENANT      = 'Tenant';
}
