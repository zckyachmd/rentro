<?php

namespace App\Enum;

enum Locale: string
{
    case EN = 'en';
    case ID = 'id';

    public function label(): string
    {
        return __('enum.locale.' . strtolower($this->name));
    }
}
