<?php

namespace App\Http\Requests\Management\Contract;

use Illuminate\Foundation\Http\FormRequest;

class UpdateContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'start_date'           => ['sometimes', 'date'],
            'end_date'             => ['nullable', 'date', 'after_or_equal:start_date'],
            'rent_cents'           => ['sometimes', 'integer', 'min:0'],
            'deposit_cents'        => ['sometimes', 'nullable', 'integer', 'min:0'],
            'billing_period'       => ['sometimes', 'in:daily,weekly,monthly'],
            'billing_day'          => ['sometimes', 'nullable', 'integer', 'between:1,31'],
            'auto_renew'           => ['sometimes', 'boolean'],
            'renewal_cancelled_at' => ['sometimes', 'nullable', 'date'],
            'deposit_refund_cents' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'deposit_refunded_at'  => ['sometimes', 'nullable', 'date'],
            'status'               => ['sometimes', 'in:Draft,Active,Completed,Cancelled'],
            'notes'                => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}
