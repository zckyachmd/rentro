<?php

namespace App\Http\Requests\Management\Building;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBuildingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $routeBuilding = $this->route('building');
        $id            = $routeBuilding ? (int) $routeBuilding->id : 0;

        return [
            'name' => ['required', 'string', 'max:100'],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('buildings', 'code')->ignore($id)->whereNull('deleted_at'),
            ],
            'address'   => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
