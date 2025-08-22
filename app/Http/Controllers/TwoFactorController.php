<?php

namespace App\Http\Controllers;

use App\Http\Requests\Security\ConfirmTwoFactorRequest;
use App\Services\Contracts\TwoFactorServiceInterface as TFA;
use App\Traits\LogActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class TwoFactorController extends Controller
{
    use LogActivity;

    public function start(Request $request, TFA $tfa): RedirectResponse
    {
        $user = $request->user();

        if (empty($user->two_factor_secret)) {
            $user->two_factor_secret         = $tfa->generateSecret();
            $user->two_factor_recovery_codes = $tfa->generateRecoveryCodes();
            $user->two_factor_confirmed_at   = null;
            $user->save();
        }

        $this->logEvent(event: 'security.2fa_enabled', subject: $user, logName: 'security');

        return back()->with('status', '2fa-setup-started');
    }

    public function qr(Request $request, TFA $tfa): HttpResponse
    {
        $user = $request->user();
        if (empty($user->two_factor_secret) || !empty($user->two_factor_confirmed_at)) {
            abort(404);
        }

        $issuer  = config('twofactor.issuer', config('app.name'));
        $account = $user->email ?? $user->username ?? ('user-' . $user->id);
        $svg     = $tfa->makeQrSvgFromParts($account, $user->two_factor_secret, $issuer);

        return response()->json([
            'svg'    => $svg,
            'secret' => $user->two_factor_secret,
        ]);
    }

    public function confirm(ConfirmTwoFactorRequest $request, TFA $tfa): RedirectResponse
    {
        $user = $request->user();
        if (empty($user->two_factor_secret)) {
            return back()->withErrors(['code' => '2FA belum diinisiasi.']);
        }

        $code = $request->validated()['code'];
        if (!$tfa->verify($user->two_factor_secret, $code)) {
            return back()->withErrors(['code' => 'Kode OTP tidak valid atau kedaluwarsa.']);
        }

        $user->two_factor_confirmed_at = now();
        $user->save();

        $this->logEvent(event: 'security.2fa_confirmed', subject: $user, logName: 'security');

        return back()->with('status', '2fa-confirmed');
    }

    public function cancel(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (empty($user->two_factor_secret) || !empty($user->two_factor_confirmed_at)) {
            return back()->withErrors(['status' => 'Tidak ada proses 2FA yang perlu dibatalkan.']);
        }

        $user->forceFill([
            'two_factor_secret'         => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at'   => null,
        ])->save();

        $this->logEvent(event: 'security.2fa_cancelled', subject: $user, logName: 'security');

        return back()->with('status', '2fa-cancelled');
    }

    public function disable(Request $request): RedirectResponse
    {
        $user = $request->user();
        $user->forceFill([
            'two_factor_secret'         => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at'   => null,
        ])->save();

        $this->logEvent(event: 'security.2fa_disabled', subject: $user, logName: 'security');

        return back()->with('status', '2fa-disabled');
    }

    public function recoveryCode(Request $request): HttpResponse
    {
        $user = $request->user();
        if (empty($user->two_factor_secret) || empty($user->two_factor_confirmed_at)) {
            abort(404);
        }

        return response()->json([
            'codes' => (array) ($user->two_factor_recovery_codes ?? []),
        ]);
    }

    public function recoveryRegenerate(Request $request, TFA $tfa): RedirectResponse
    {
        $user = $request->user();
        if (empty($user->two_factor_secret) || empty($user->two_factor_confirmed_at)) {
            return back()->withErrors(['status' => 'Aktifkan & konfirmasi 2FA terlebih dahulu.']);
        }

        $user->two_factor_recovery_codes = $tfa->generateRecoveryCodes();
        $user->save();

        $this->logEvent(event: 'security.2fa_recovery_regenerated', subject: $user, logName: 'security');

        return back()->with('status', '2fa-recovery-regenerated');
    }
}
