<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\TwoFactorRequest;
use App\Models\User;
use App\Services\Contracts\TwoFactorServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;

class TwoFactorLoginController extends Controller
{
    public function __construct(private readonly TwoFactorServiceInterface $twofa)
    {
    }

    public function create()
    {
        if (!Session::has('2fa:user:id')) {
            return redirect()->route('login');
        }

        return inertia('auth/two-factor');
    }

    public function store(TwoFactorRequest $request): RedirectResponse
    {
        $user  = $request->ensureValidTwoFactorContext();
        $token = (string) $request->validated('token');
        $isOtp = ctype_digit($token);

        $ok = $isOtp
            ? $this->twofa->verifyEncryptedOrPlain((string) $user->two_factor_secret, $token)
            : $this->useRecoveryCodeToken($user, $token);

        if (!$ok) {
            return back()->withErrors([
                'token' => $isOtp ? __('auth.2fa.invalid_otp') : __('auth.2fa.invalid_recovery'),
            ]);
        }

        $remember = (bool) Session::pull('2fa:remember', false);

        Auth::login($user, $remember);

        $request->session()->regenerate();
        $request->clearTwoFactorSession();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    protected function useRecoveryCodeToken(User $user, string $recovery): bool
    {
        $inputNorm       = $this->twofa->normalizeRecoveryCode($recovery);
        $codesOriginal   = $this->twofa->parseRecoveryCodes($user->two_factor_recovery_codes);
        $codesNormalized = array_map(fn ($c) => $this->twofa->normalizeRecoveryCode($c), $codesOriginal);

        $idx = array_search($inputNorm, $codesNormalized, true);
        if ($idx === false) {
            return false;
        }

        unset($codesOriginal[$idx]);

        $codesOriginal                   = array_values($codesOriginal);
        $user->two_factor_recovery_codes = $codesOriginal;
        $user->save();

        return true;
    }
}
