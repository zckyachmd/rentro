<?php

namespace App\Enum;

enum PromotionActionType: string
{
    case PERCENT                 = 'percent';
    case AMOUNT                  = 'amount';
    case FIXED_PRICE             = 'fixed_price';
    case FREE_N_DAYS             = 'free_n_days';
    case FIRST_N_PERIODS_PERCENT = 'first_n_periods_percent';
    case FIRST_N_PERIODS_AMOUNT  = 'first_n_periods_amount';

    public function label(): string
    {
        return __('enum.promotion.action_type.' . $this->value);
    }
}
