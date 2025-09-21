<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PayVaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $banks = array_map('strval', (array) config('midtrans.va_banks', ['bca', 'bni', 'bri', 'permata', 'cimb']));

        return [
            'bank' => ['required', 'string', Rule::in($banks)],
        ];
    }
}
