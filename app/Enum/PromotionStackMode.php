<?php

namespace App\Enum;

enum PromotionStackMode: string
{
    case STACK        = 'stack';
    case HIGHEST_ONLY = 'highest_only';
    case EXCLUSIVE    = 'exclusive';

    public function label(): string
    {
        return __('enum.promotion.stack_mode.' . $this->value);
    }
}
