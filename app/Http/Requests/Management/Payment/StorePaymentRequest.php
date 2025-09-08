<?php

namespace App\Http\Requests\Management\Payment;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_id' => ['required', 'integer', 'exists:invoices,id'],
            // Admin manual: Cash or Transfer
            'method' => ['required', 'in:Cash,Transfer'],
            // Let backend decide final status (manual => Completed)
            'status'        => ['sometimes', 'in:Pending,Completed,Failed,Cancelled'],
            'amount_cents'  => ['required', 'integer', 'min:1'],
            'paid_at'       => ['nullable', 'date'],
            'provider'      => ['nullable', 'string', 'max:50'],
            'va_number'     => ['nullable', 'string', 'max:50'],
            'va_expired_at' => ['nullable', 'date'],
            'meta'          => ['nullable', 'array'],
            'note'          => ['nullable', 'string'],
            'attachment'    => ['nullable', 'file', 'max:5120', 'mimes:jpg,jpeg,png,pdf'],
        ];
    }
}
