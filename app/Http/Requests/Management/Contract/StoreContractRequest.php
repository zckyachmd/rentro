<?php

namespace App\Http\Requests\Management\Contract;

use App\Enum\BillingPeriod;
use App\Models\AppSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $monthlyAllowed = AppSetting::config('contract.monthly_allowed_terms', [3, 6, 12]);
        $monthlyAllowed = is_array($monthlyAllowed) ? array_values(array_unique(array_map('intval', $monthlyAllowed))) : [3, 6, 12];
        sort($monthlyAllowed);

        $dailyMax  = AppSetting::config('contract.daily_max_days', 5);
        $weeklyMax = AppSetting::config('contract.weekly_max_weeks', 3);

        return [
            'user_id'        => ['required', 'integer', 'exists:users,id'],
            'room_id'        => ['required', 'integer', 'exists:rooms,id'],
            'start_date'     => ['required', 'date'],
            'end_date'       => ['nullable', 'date', 'after_or_equal:start_date'],
            'rent_idr'       => ['required', 'integer', 'min:0'],
            'deposit_idr'    => ['nullable', 'integer', 'min:0'],
            'billing_period' => ['required', 'in:' . implode(',', array_map(fn (BillingPeriod $p) => $p->value, BillingPeriod::cases()))],
            'billing_day'    => ['nullable', 'integer', 'between:1,31'],
            'auto_renew'     => ['nullable', 'boolean'],
            'notes'          => ['nullable', 'string', 'max:500'],
            // Optional promo code that a manager can supply during contract creation
            'promo_code' => ['nullable', 'string', 'max:64'],

            'duration_count'       => ['required', 'integer', 'min:1'],
            'monthly_payment_mode' => [
                Rule::requiredIf(fn () => (string) request()->input('billing_period') === BillingPeriod::MONTHLY->value),
                Rule::in(['full', 'per_month']),
            ],

            'duration_count_daily' => [
                'exclude_unless:billing_period,' . BillingPeriod::DAILY->value,
                'integer',
                'min:1',
                'max:' . max(1, $dailyMax),
            ],
            'duration_count_weekly' => [
                'exclude_unless:billing_period,' . BillingPeriod::WEEKLY->value,
                'integer',
                'min:1',
                'max:' . max(1, $weeklyMax),
            ],
            'duration_count_monthly' => [
                'exclude_unless:billing_period,' . BillingPeriod::MONTHLY->value,
                Rule::in($monthlyAllowed),
            ],
        ];
    }
}
