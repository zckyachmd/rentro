<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class PayManualRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'bank'       => ['required', 'string', 'max:30'],
            'note'       => ['nullable', 'string', 'max:200'],
            'paid_at'    => ['required', 'date'],
            'attachment' => ['required', 'file', 'max:5120', 'mimes:jpg,jpeg,png,pdf'],
        ];
    }
}
