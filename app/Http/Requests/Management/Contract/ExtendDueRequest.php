<?php

namespace App\Http\Requests\Management\Contract;

use Illuminate\Foundation\Http\FormRequest;

class ExtendDueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'due_date' => ['required', 'date', 'after:today'],
        ];
    }
}
