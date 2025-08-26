<?php

namespace App\Http\Requests\Management\Role;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
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
        $role   = $this->route('role');
        $guards = array_keys(config('auth.guards'));

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('roles', 'name')
                    ->where(fn ($q) => $q->where('guard_name', $this->input('guard_name', $role->guard_name)))
                    ->ignore($role->id),
            ],
            'guard_name' => ['required', 'string', Rule::in($guards)],
        ];
    }
}
