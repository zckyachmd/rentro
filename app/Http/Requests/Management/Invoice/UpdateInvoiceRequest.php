<?php

namespace App\Http\Requests\Management\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('invoice')->id ?? null;

        return [
            'number'       => ['sometimes', 'string', 'max:50', 'unique:invoices,number,' . $id],
            'period_start' => ['sometimes', 'nullable', 'date'],
            'period_end'   => ['sometimes', 'nullable', 'date', 'after_or_equal:period_start'],
            'due_date'     => ['sometimes', 'date'],
            'amount_cents' => ['sometimes', 'integer', 'min:0'],
            'status'       => ['sometimes', 'in:Pending,Paid,Cancelled'],
            'paid_at'      => ['sometimes', 'nullable', 'date'],
            'notes'        => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}
