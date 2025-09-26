<?php

namespace App\Http\Requests\Management\Promotion;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePromotionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('promotion.update') ?? false;
    }

    public function rules(): array
    {
        $promotion = $this->route('promotion');
        $id        = $promotion ? $promotion->id : null;

        return [
            'name' => ['required', 'string', 'max:150'],
            'slug' => [
                'nullable', 'string', 'max:160',
                Rule::unique('promotions', 'slug')->ignore($id)->whereNull('deleted_at'),
            ],
            'description'        => ['nullable', 'string', 'max:2000'],
            'valid_from'         => ['nullable', 'date'],
            'valid_until'        => ['nullable', 'date', 'after_or_equal:valid_from'],
            'stack_mode'         => ['required', Rule::in(['stack', 'highest_only', 'exclusive'])],
            'priority'           => ['nullable', 'integer', 'min:0', 'max:100000'],
            'total_quota'        => ['nullable', 'integer', 'min:0'],
            'per_user_limit'     => ['nullable', 'integer', 'min:0'],
            'per_contract_limit' => ['nullable', 'integer', 'min:0'],
            'per_invoice_limit'  => ['nullable', 'integer', 'min:0'],
            'per_day_limit'      => ['nullable', 'integer', 'min:0'],
            'per_month_limit'    => ['nullable', 'integer', 'min:0'],
            'default_channel'    => ['nullable', Rule::in(['public', 'referral', 'manual', 'coupon'])],
            'require_coupon'     => ['boolean'],
            'is_active'          => ['boolean'],
            'tags'               => ['nullable', 'array'],
            'tags.*'             => ['string', 'max:50'],
        ];
    }
}
