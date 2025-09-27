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
                'nullable', 'string', 'max:160', 'regex:/^[a-z0-9-]+$/',
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

    protected function prepareForValidation(): void
    {
        $trim = function ($v) {
            return is_string($v) ? trim($v) : $v;
        };
        $nullIfEmpty = function ($v) {
            return ($v === '' || $v === null) ? null : $v;
        };

        $input                = $this->all();
        $input['name']        = $trim($input['name'] ?? '');
        $input['slug']        = $trim($input['slug'] ?? '');
        $input['description'] = $trim($input['description'] ?? '');

        foreach (['valid_from', 'valid_until'] as $k) {
            $input[$k] = $nullIfEmpty($input[$k] ?? null);
        }
        foreach (
            [
            'priority', 'total_quota', 'per_user_limit', 'per_contract_limit',
            'per_invoice_limit', 'per_day_limit', 'per_month_limit',
            ] as $k
        ) {
            $val = $nullIfEmpty($input[$k] ?? null);
            if (is_string($val) && is_numeric($val)) {
                $input[$k] = (int) $val;
            } else {
                $input[$k] = $val;
            }
        }
        if (array_key_exists('require_coupon', $input)) {
            $input['require_coupon'] = filter_var($input['require_coupon'], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false;
        }
        if (array_key_exists('is_active', $input)) {
            $input['is_active'] = filter_var($input['is_active'], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true;
        }

        $this->replace($input);
    }
}
