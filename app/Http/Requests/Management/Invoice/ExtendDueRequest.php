<?php

namespace App\Http\Requests\Management\Invoice;

use App\Rules\Reason;
use Illuminate\Foundation\Http\FormRequest;

class ExtendDueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'due_date' => ['required', 'date', 'after:today'],
            'reason'   => ['required', new Reason(3)],
        ];
    }
}
