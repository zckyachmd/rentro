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
            'contract_id' => ['required', 'integer', 'exists:contracts,id'],
            'mode'        => ['required', 'in:per_month,full'],
            'reason'      => ['required', 'string', 'min:3', 'max:500'],
            'target'      => ['nullable', 'in:current,next'],
        ];
    }
}
