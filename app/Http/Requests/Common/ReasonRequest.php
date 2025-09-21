<?php

namespace App\Http\Requests\Common;

use App\Rules\Reason;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Generic request for a required 'reason' string.
 * Reuse for actions that must include a reason (eg. cancel, reject).
 */
class ReasonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('reason')) {
            $reason = trim((string) $this->input('reason'));
            $this->merge(['reason' => $reason]);
        }
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', new Reason()],
        ];
    }
}
