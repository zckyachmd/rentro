<?php

namespace App\Http\Requests\Management\User;

use App\Enum\RoleName;
use Illuminate\Foundation\Http\FormRequest;

class ForceLogoutRequest extends FormRequest
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
            'scope'  => ['required', 'in:all,all_except_current'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $actor  = $this->user();
        $target = $this->route('user');

        if ($actor && $target && $actor->id === $target->id) {
            $validator->errors()->add('scope', 'Anda tidak diperbolehkan mencabut sesi Anda sendiri dari modul ini.');

            return;
        }

        if (
            $actor &&
            $target &&
            $target->hasRole(RoleName::SUPER_ADMIN->value) &&
            !$actor->hasRole(RoleName::SUPER_ADMIN->value)
        ) {
            $validator->errors()->add('scope', 'Anda tidak memiliki izin untuk mencabut sesi pengguna dengan peran Super Admin.');
        }
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('scope')) {
            $this->merge(['scope' => (string) $this->input('scope')]);
        }
        if ($this->missing('reason')) {
            $this->merge(['reason' => null]);
        }
    }
}
