<?php

namespace App\Http\Requests\Management\Content;

use Illuminate\Foundation\Http\FormRequest;

class UploadContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file'       => ['required', 'file', 'max:5120'],
            'collection' => ['nullable', 'string', 'max:100'],
        ];
    }
}
