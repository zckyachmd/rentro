<?php

namespace App\Http\Requests\Management\Promotion;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePromotionScopeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('promotion.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'scope_type'   => ['required', Rule::in(['global', 'building', 'floor', 'room_type', 'room'])],
            'building_id'  => ['nullable', 'integer', 'min:1'],
            'floor_id'     => ['nullable', 'integer', 'min:1'],
            'room_type_id' => ['nullable', 'integer', 'min:1'],
            'room_id'      => ['nullable', 'integer', 'min:1'],
        ];
    }
}
