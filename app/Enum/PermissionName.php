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

    // Kamar
    case ROOM_VIEW   = 'room.view';
    case ROOM_CREATE = 'room.create';
    case ROOM_UPDATE = 'room.update';
    case ROOM_DELETE = 'room.delete';
}
