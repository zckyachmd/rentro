<?php

namespace App\Http\Requests\Management\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class LookupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null; // restrict to authenticated management users via route middleware
    }

    public function rules(): array
    {
        return [
            'number' => ['required', 'string'],
        ];
    }
}
