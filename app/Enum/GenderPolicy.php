<?php

namespace App\Enum;

enum GenderPolicy: string
{
    case ANY    = 'any';
    case MALE   = 'male';
    case FEMALE = 'female';
}
