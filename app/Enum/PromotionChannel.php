<?php

namespace App\Enum;

enum PromotionChannel: string
{
    case PUBLIC   = 'public';
    case REFERRAL = 'referral';
    case MANUAL   = 'manual';
    case COUPON   = 'coupon';

    public function label(): string
    {
        return __('enum.promotion.channel.' . $this->value);
    }
}
