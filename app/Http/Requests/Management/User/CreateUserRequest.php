<?php

namespace App\Http\Requests\Management\User;

use App\Enum\RoleName;
use Illuminate\Foundation\Http\FormRequest;
use Spatie\Permission\Models\Role;

class CreateUserRequest extends FormRequest
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
        return [
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone'                 => ['nullable', 'string', 'max:30'],
            'roles'                 => ['required', 'array', 'min:1'],
            'roles.*'               => ['integer', 'exists:roles,id'],
            'force_password_change' => ['sometimes', 'boolean'],
            'send_verification'     => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $actor   = $this->user();
        $roleIds = (array) $this->input('roles', []);

        if (!$actor || empty($roleIds)) {
            return;
        }

        if (!$actor->hasRole(RoleName::SUPER_ADMIN->value)) {
            $names = Role::query()->whereIn('id', $roleIds)->pluck('name');
            if ($names->contains(RoleName::SUPER_ADMIN->value)) {
                $validator->errors()->add('roles', 'Anda tidak memiliki izin untuk membuat pengguna dengan peran Super Admin.');
            }
        }
    }
}
