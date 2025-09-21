<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() === null;
    }

    /**
     * Validasi:
     * - pakai 'login' (email/username), atau fallback 'email' kalau FE lama
     */
    public function rules(): array
    {
        return [
            'login'    => ['required_without:email', 'string'],
            'email'    => ['required_without:login', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }
}
