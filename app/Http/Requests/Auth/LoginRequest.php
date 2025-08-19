<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
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

    /**
     * Autentikasi:
     * - deteksi email vs username
     * - lowercasing username jika perlu (agar konsisten jika tidak pakai CITEXT)
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $rawLogin = (string) ($this->input('login') ?? $this->input('email') ?? '');
        $password = (string) $this->input('password');

        $field = filter_var($rawLogin, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $value = $field === 'username' ? mb_strtolower($rawLogin) : $rawLogin;

        $credentials = [
            $field     => $value,
            'password' => $password,
        ];

        if (! Auth::attempt($credentials, $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            // kembalikan error ke field 'login' agar FE baru/lama tetap relevan
            throw ValidationException::withMessages([
                'login' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Rate limiter (gabung login/email + IP).
     */
    public function throttleKey(): string
    {
        $identifier = (string) ($this->input('login') ?? $this->input('email') ?? '');
        return Str::lower($identifier) . '|' . $this->ip();
    }

    /**
     * Pastikan tidak melewati batas percobaan login.
     */
    protected function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'login' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }
}
