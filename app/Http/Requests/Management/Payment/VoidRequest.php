<?php

namespace App\Http\Requests\Management\Payment;

use App\Rules\Reason;
use Illuminate\Foundation\Http\FormRequest;

class VoidRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'reason' => ['nullable', new Reason(0, 200)],
        ];
    }
}
