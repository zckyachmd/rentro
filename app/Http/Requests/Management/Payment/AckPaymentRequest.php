<?php

namespace App\Http\Requests\Management\Payment;

use Illuminate\Foundation\Http\FormRequest;

class AckPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'ack'     => ['nullable', 'accepted'],
            'reason'  => ['required_without:ack', 'string', 'max:200'],
            'note'    => ['nullable', 'string'],
            'paid_at' => ['nullable', 'date'],
            // No admin attachment during review
        ];
    }
}
