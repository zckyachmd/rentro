<?php

namespace App\Http\Requests\Auth;

use App\Rules\StrongPassword;
use App\Rules\ValidUsername;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() === null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'username' => [
                'required',
                'string',
                new ValidUsername(),
                Rule::unique('users', 'username'),
            ],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],
            'password' => ['required', 'confirmed', new StrongPassword()],
        ];
    }
}
