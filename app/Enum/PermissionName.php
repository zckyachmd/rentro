<?php

namespace App\Enum;

enum PermissionName: string
{
    // Akun
    case USER_VIEW           = 'user.view';
    case USER_CREATE         = 'user.create';
    case USER_ROLE_MANAGE    = 'user.role.manage';
    case USER_PASSWORD_RESET = 'user.password.reset';
    case USER_TWO_FACTOR     = 'user.two-factor';
    case USER_FORCE_LOGOUT   = 'user.force-logout';
    case USER_DISABLE        = 'user.disable';

    // Role
    case ROLE_VIEW              = 'role.view';
    case ROLE_CREATE            = 'role.create';
    case ROLE_UPDATE            = 'role.update';
    case ROLE_DELETE            = 'role.delete';
    case ROLE_PERMISSION_MANAGE = 'role.permission.manage';

    // Audit Log
    case AUDIT_LOG_VIEW = 'audit-log.view';

    // Kamar
    case ROOM_MANAGE_VIEW   = 'room.manage.view';
    case ROOM_MANAGE_CREATE = 'room.manage.create';
    case ROOM_MANAGE_UPDATE = 'room.manage.update';
    case ROOM_MANAGE_DELETE = 'room.manage.delete';
}
