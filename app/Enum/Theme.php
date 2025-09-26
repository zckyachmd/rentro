<?php

namespace App\Enum;

enum Theme: string
{
    case LIGHT  = 'light';
    case DARK   = 'dark';
    case SYSTEM = 'system';

    public function label(): string
    {
        return __('enum.theme.' . strtolower($this->name));
    }
}
