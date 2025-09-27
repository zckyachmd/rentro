<?php

namespace App\Http\Requests\Management\Testimony;

use App\Enum\TestimonyStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateTestimonyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('testimony.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'content_curated' => ['nullable', 'string', 'max:5000'],
            'status'          => ['required', new Enum(TestimonyStatus::class)],
        ];
    }
}
