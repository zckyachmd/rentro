<?php

namespace App\Http\Requests\Management\Contract;

use Illuminate\Foundation\Http\FormRequest;

class SetAutoRenewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'auto_renew' => ['required', 'boolean'],
        ];
    }
}
