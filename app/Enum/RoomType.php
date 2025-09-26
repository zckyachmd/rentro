<?php

namespace App;

enum RoomType: string
{
    case STANDARD = 'standard';
    case DELUXE   = 'deluxe';
    case SUITE    = 'suite';
    case ECONOMY  = 'economy';

    public function label(): string
    {
        return __('enum.room.type.' . strtolower($this->name));
    }
}
