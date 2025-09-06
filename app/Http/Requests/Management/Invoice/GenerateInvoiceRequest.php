<?php

namespace App\Http\Requests\Management\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class GenerateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contract_id'  => ['required', 'integer', 'exists:contracts,id'],
            'mode'         => ['required', 'in:per_month,full'],
            'reason'       => ['required', 'string', 'min:3', 'max:500'],
            'period_month' => ['nullable', 'date_format:Y-m'],
            'range'        => ['nullable', 'array'],
            'range.from'   => ['nullable', 'date_format:Y-m-d'],
            'range.to'     => ['nullable', 'date_format:Y-m-d'],
        ];
    }
}
