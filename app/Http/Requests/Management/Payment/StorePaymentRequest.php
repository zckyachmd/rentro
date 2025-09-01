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
            'invoice_id'    => ['required', 'integer', 'exists:invoices,id'],
            'method'        => ['required', 'in:Cash,VirtualAccount'],
            'status'        => ['required', 'in:Pending,Completed,Failed,Cancelled'],
            'amount_cents'  => ['required', 'integer', 'min:0'],
            'paid_at'       => ['nullable', 'date'],
            'reference'     => ['nullable', 'string', 'max:100'],
            'provider'      => ['nullable', 'string', 'max:50'],
            'va_number'     => ['nullable', 'string', 'max:50'],
            'va_expired_at' => ['nullable', 'date'],
            'meta'          => ['nullable', 'array'],
        ];
    }
}
