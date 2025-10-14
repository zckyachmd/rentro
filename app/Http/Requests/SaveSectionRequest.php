<?php

namespace App\Http\Requests;

use App\Enum\RoleName;
use Illuminate\Foundation\Http\FormRequest;

class SaveSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) {
            return false;
        }
        if (method_exists($user, 'hasAnyRole')) {
            return $user->hasAnyRole([
                RoleName::SUPER_ADMIN->value,
                RoleName::OWNER->value,
                RoleName::MANAGER->value,
            ]);
        }
        if (method_exists($user, 'hasRole')) {
            return $user->hasRole(RoleName::MANAGER->value)
                || $user->hasRole(RoleName::OWNER->value)
                || $user->hasRole(RoleName::SUPER_ADMIN->value);
        }

        return false;
    }

    public function rules(): array
    {
        return [
            'page'     => ['required', 'string', 'in:home,about,privacy'],
            'section'  => ['required', 'string'],
            'locale'   => ['required', 'string', 'in:id,en'],
            'values'   => ['required', 'array'],
            'values.*' => ['nullable', 'string'],
        ];
    }
}
