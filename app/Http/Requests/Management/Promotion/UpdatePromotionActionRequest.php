<?php

namespace App\Http\Requests\Management\Promotion;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePromotionActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('promotion.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'action_type'        => ['required', Rule::in(['percent', 'amount', 'fixed_price', 'free_n_days', 'first_n_periods_percent', 'first_n_periods_amount'])],
            'applies_to_rent'    => ['boolean'],
            'applies_to_deposit' => ['boolean'],
            'percent_bps'        => ['nullable', 'integer', 'min:1', 'max:10000'],
            'amount_idr'         => ['nullable', 'integer', 'min:0'],
            'fixed_price_idr'    => ['nullable', 'integer', 'min:0'],
            'n_days'             => ['nullable', 'integer', 'min:1', 'max:31'],
            'n_periods'          => ['nullable', 'integer', 'min:1', 'max:36'],
            'max_discount_idr'   => ['nullable', 'integer', 'min:0'],
            'priority'           => ['nullable', 'integer', 'min:0', 'max:100000'],
        ];
    }
}
