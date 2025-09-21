<?php

namespace App\Http\Requests\Management\Payment;

use Illuminate\Foundation\Http\FormRequest;

class AckRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            // Ack is optional; if provided and truthy, controller treats as approve
            'ack'     => ['nullable'],
            'reason'  => ['required_without:ack', 'string', 'max:200'],
            'note'    => ['nullable', 'string'],
            'paid_at' => ['nullable', 'date'],
        ];
    }
}
