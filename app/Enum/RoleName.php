<?php

namespace App\Enum;

enum RoleName: string
{
    case SUPER_ADMIN = 'super-admin';
    case OWNER       = 'owner';
    case MANAGER     = 'manager';
    case TENANT      = 'tenant';
}
