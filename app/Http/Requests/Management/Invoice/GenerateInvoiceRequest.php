<?php

namespace App\Http\Requests\Management\Invoice;

use App\Rules\Reason;
use Illuminate\Foundation\Http\FormRequest;

class GenerateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'contract_id'  => ['required', 'integer', 'exists:contracts,id'],
            'mode'         => ['required', 'in:per_month,full'],
            'reason'       => ['required', new Reason(20, 200)],
            'period_month' => ['nullable', 'date_format:Y-m'],
            'range'        => ['nullable', 'array'],
            'range.from'   => ['nullable', 'date_format:Y-m-d'],
            'range.to'     => ['nullable', 'date_format:Y-m-d'],
        ];
    }
}
