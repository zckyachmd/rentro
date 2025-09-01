<?php

namespace App\Http\Requests\Management\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contract_id'  => ['required', 'integer', 'exists:contracts,id'],
            'number'       => ['required', 'string', 'max:50', 'unique:invoices,number'],
            'period_start' => ['nullable', 'date'],
            'period_end'   => ['nullable', 'date', 'after_or_equal:period_start'],
            'due_date'     => ['required', 'date'],
            'amount_cents' => ['required', 'integer', 'min:0'],
            'status'       => ['nullable', 'in:Pending,Paid,Cancelled'],
            'notes'        => ['nullable', 'string', 'max:500'],
        ];
    }
}
