<?php

namespace App\Http\Requests\Management\Promotion;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePromotionRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('promotion.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'min_spend_idr'        => ['nullable', 'integer', 'min:0'],
            'max_discount_idr'     => ['nullable', 'integer', 'min:0'],
            'applies_to_rent'      => ['boolean'],
            'applies_to_deposit'   => ['boolean'],
            'billing_periods'      => ['nullable', 'array'],
            'billing_periods.*'    => [Rule::in(['daily', 'weekly', 'monthly'])],
            'date_from'            => ['nullable', 'date'],
            'date_until'           => ['nullable', 'date', 'after_or_equal:date_from'],
            'days_of_week'         => ['nullable', 'array'],
            'days_of_week.*'       => ['integer', 'min:1', 'max:7'],
            'time_start'           => ['nullable', 'date_format:H:i'],
            'time_end'             => ['nullable', 'date_format:H:i'],
            'channel'              => ['nullable', Rule::in(['public', 'referral', 'manual', 'coupon'])],
            'first_n_periods'      => ['nullable', 'integer', 'min:1'],
            'allowed_role_names'   => ['nullable', 'array'],
            'allowed_role_names.*' => ['string', 'max:64'],
            'allowed_user_ids'     => ['nullable', 'array'],
            'allowed_user_ids.*'   => ['integer', 'min:1'],
        ];
    }
}
