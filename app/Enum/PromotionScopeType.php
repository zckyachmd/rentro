<?php

namespace App\Enum;

enum PromotionScopeType: string
{
    case GLOBAL    = 'global';
    case BUILDING  = 'building';
    case FLOOR     = 'floor';
    case ROOM_TYPE = 'room_type';
    case ROOM      = 'room';

    public function label(): string
    {
        return __('enum.promotion.scope_type.' . $this->value);
    }
}
