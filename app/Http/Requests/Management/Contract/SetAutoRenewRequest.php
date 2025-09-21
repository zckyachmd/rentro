<?php

namespace App\Http\Requests\Management\Contract;

use App\Rules\Reason;
use Illuminate\Foundation\Http\FormRequest;

class SetAutoRenewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('reason')) {
            $this->merge(['reason' => trim((string) $this->input('reason'))]);
        }
    }

    public function rules(): array
    {
        return [
            'auto_renew' => ['required', 'boolean'],
            'reason'     => ['required_unless:auto_renew,true', new Reason()],
        ];
    }
}
