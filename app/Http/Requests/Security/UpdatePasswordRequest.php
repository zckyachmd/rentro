<?php

namespace App\Http\Requests\Security;

use App\Rules\StrongPassword;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePasswordRequest extends FormRequest
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
        $user = $this->user();

        return [
            'current_password' => ['required', 'current_password'],
            'password'         => [
                'required',
                'confirmed',
                'different:current_password',
                new StrongPassword(username: $user?->username, email: $user?->email),
            ],
        ];
    }
}
