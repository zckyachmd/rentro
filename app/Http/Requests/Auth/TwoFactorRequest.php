<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Session;

class TwoFactorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() === null;
    }

    /**
     * Sanitize the `token` input before validation.
     * Trim whitespace and convert to uppercase to normalize the input format.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('token')) {
            $this->merge([
                'token' => strtoupper(trim((string) $this->input('token'))),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     * Token can be a 6-digit OTP or an alphanumeric recovery code with dashes.
     */
    public function rules(): array
    {
        $digits  = (int) config('twofactor.digits', 6);
        $pattern = '/^(\d{' . $digits . '}|[A-F0-9]{8}-[A-F0-9]{8})$/i';

        return [
            'token' => ['required', 'string', 'regex:' . $pattern],
        ];
    }

    /**
     * Ensure the 2FA session context is valid (user id present, not expired, user has 2FA enabled & confirmed).
     * If invalid, clears the 2FA session and aborts with a redirect back to login with errors.
     *
     * @return \App\Models\User The pending user for 2FA
     */
    public function ensureValidTwoFactorContext(): User
    {
        $userId       = Session::get('2fa:user:id');
        $expiresAtStr = Session::get('2fa:expires_at');
        $expired      = false;

        if ($expiresAtStr) {
            try {
                $expired = now()->greaterThan(Carbon::parse($expiresAtStr));
            } catch (\Throwable) {
                $expired = true;
            }
        }

        if (!$userId || $expired) {
            $this->clearTwoFactorSession();
            abort(redirect()->route('login')->withErrors(['email' => 'Session 2FA kedaluwarsa.']));
        }

        $user = User::find($userId);
        if (!$user || empty($user->two_factor_secret) || empty($user->two_factor_confirmed_at)) {
            $this->clearTwoFactorSession();
            abort(redirect()->route('login')->withErrors(['email' => 'Session 2FA tidak valid.']));
        }

        return $user;
    }

    /**
     * Clears the 2FA session context, removing the user ID, remember flag and expiration timestamp.
     */
    public function clearTwoFactorSession(): void
    {
        Session::forget(['2fa:user:id', '2fa:remember', '2fa:expires_at']);
    }
}
