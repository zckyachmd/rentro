<?php

namespace App\Http\Requests\Management\Payment;

use App\Enum\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'invoice_id'    => ['required', 'integer', 'exists:invoices,id'],
            'method'        => ['required', 'in:' . collect(PaymentMethod::options(true))->pluck('value')->implode(',')],
            'amount_cents'  => ['required', 'integer', 'min:1'],
            'paid_at'       => ['nullable', 'date'],
            'provider'      => ['nullable', 'string', 'max:50'],
            'va_number'     => ['nullable', 'string', 'max:50'],
            'va_expired_at' => ['nullable', 'date'],
            'meta'          => ['nullable', 'array'],
            'note'          => ['nullable', 'string'],
            'attachment'    => ['required_if:method,Transfer', 'file', 'max:5120', 'mimes:jpg,jpeg,png,pdf'],
        ];
    }
}
