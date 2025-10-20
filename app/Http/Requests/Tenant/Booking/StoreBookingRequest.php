<?php

namespace App\Http\Requests\Tenant\Booking;

use App\Enum\BillingPeriod;
use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'room_id'        => ['required', 'integer', 'exists:rooms,id'],
            'start_date'     => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'duration_count' => ['required', 'integer', 'min:1', 'max:24'],
            'billing_period' => ['required', 'in:' . implode(',', array_map(fn ($c) => $c->value, BillingPeriod::cases()))],
            'promo_code'     => ['nullable', 'string', 'max:64'],
            'notes'          => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function prepareForValidation(): void
    {
        $bp = (string) ($this->input('billing_period') ?? 'monthly');
        if ($bp === '') {
            $this->merge(['billing_period' => BillingPeriod::MONTHLY->value]);
        }
    }
}
