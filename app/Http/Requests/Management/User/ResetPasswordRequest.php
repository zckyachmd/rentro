<?php

namespace App\Http\Requests\Management\User;

use App\Enum\RoleName;
use App\Rules\Reason;
use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
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
            'mode'       => ['required', 'in:send,generate'],
            'send_email' => ['sometimes', 'boolean'],
            'reason'     => ['required', new Reason(20)],
        ];
    }

    public function withValidator($validator)
    {
        $actor  = $this->user();
        $target = $this->route('user');

        if ($actor && $target && $target->hasRole(RoleName::SUPER_ADMIN->value) && !$actor->hasRole(RoleName::SUPER_ADMIN->value)) {
            $validator->errors()->add('mode', 'Anda tidak memiliki izin untuk mereset password pengguna dengan peran Super Admin.');
        }
    }
}
