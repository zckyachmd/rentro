<?php

namespace App\Http\Requests\Management\Payment;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'method'        => ['sometimes', 'in:Cash,VirtualAccount'],
            'status'        => ['sometimes', 'in:Pending,Completed,Failed,Cancelled'],
            'amount_cents'  => ['sometimes', 'integer', 'min:0'],
            'paid_at'       => ['sometimes', 'nullable', 'date'],
            'reference'     => ['sometimes', 'nullable', 'string', 'max:100'],
            'provider'      => ['sometimes', 'nullable', 'string', 'max:50'],
            'va_number'     => ['sometimes', 'nullable', 'string', 'max:50'],
            'va_expired_at' => ['sometimes', 'nullable', 'date'],
            'meta'          => ['sometimes', 'nullable', 'array'],
        ];
    }
}
