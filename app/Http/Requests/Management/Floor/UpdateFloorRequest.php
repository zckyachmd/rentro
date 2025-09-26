<?php

namespace App\Http\Requests\Management\Floor;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFloorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'building_id' => ['required', 'integer', Rule::exists('buildings', 'id')],
            'level'       => ['required', 'integer', 'between:-20,300'],
            'name'        => ['nullable', 'string', 'max:100'],
        ];
    }
}
