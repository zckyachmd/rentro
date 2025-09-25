<?php

namespace App\Http\Requests\Management\Building;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateBuildingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('building.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:100'],
            'code'      => ['nullable', 'string', 'max:50', Rule::unique('buildings', 'code')->whereNull('deleted_at')],
            'address'   => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
