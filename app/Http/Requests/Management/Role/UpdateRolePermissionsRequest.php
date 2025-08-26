<?php

namespace App\Http\Requests\Management\Role;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRolePermissionsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $role = $this->route('role');

        return [
            'permission_ids'   => ['array'],
            'permission_ids.*' => [
                'integer',
                Rule::exists('permissions', 'id')
                    ->where(fn ($q) => $q->where('guard_name', $role->guard_name)),
            ],
        ];
    }
}
