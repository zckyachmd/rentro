<?php

namespace App\Http\Controllers\Security;

use App\Http\Controllers\Controller;
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

        return back()->with('success', __('security.2fa.prepare_started'));
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
            return back()
                ->withErrors(['code' => __('security.2fa.not_initiated')])
                ->with('error', __('security.2fa.not_initiated'));
        }

        $code = $request->validated()['code'];
        if (!$tfa->verify($user->two_factor_secret, $code)) {
            return back()
                ->withErrors(['code' => __('security.2fa.invalid_code')])
                ->with('error', __('security.2fa.invalid_code'));
        }

        $user->two_factor_confirmed_at = now();
        $user->save();

        $this->logEvent(event: 'security.2fa_confirmed', subject: $user, logName: 'security');

        return back()->with('success', __('security.2fa.confirmed'));
    }

    public function cancel(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (empty($user->two_factor_secret) || !empty($user->two_factor_confirmed_at)) {
            return back()
                ->withErrors(['status' => __('security.2fa.none_to_cancel')])
                ->with('error', __('security.2fa.none_to_cancel'));
        }

        $user->forceFill([
            'two_factor_secret'         => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at'   => null,
        ])->save();

        $this->logEvent(event: 'security.2fa_cancelled', subject: $user, logName: 'security');

        return back()->with('success', __('security.2fa.cancelled'));
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

        return back()->with('success', __('security.2fa.disabled'));
    }

    public function recoveryCode(Request $request, TFA $tfa): HttpResponse
    {
        $user = $request->user();
        if (empty($user->two_factor_secret) || empty($user->two_factor_confirmed_at)) {
            abort(404);
        }

        $codes = $tfa->parseRecoveryCodes($user->two_factor_recovery_codes);

        return response()->json([
            'codes' => [json_encode(array_values($codes))],
        ]);
    }

    public function recoveryRegenerate(Request $request, TFA $tfa): RedirectResponse
    {
        $user = $request->user();
        if (empty($user->two_factor_secret) || empty($user->two_factor_confirmed_at)) {
            return back()
                ->withErrors(['status' => __('security.2fa.recovery.needs_enabled')])
                ->with('error', __('security.2fa.recovery.needs_enabled'));
        }

        $user->two_factor_recovery_codes = $tfa->generateRecoveryCodes();
        $user->save();

        $this->logEvent(event: 'security.2fa_recovery_regenerated', subject: $user, logName: 'security');

        return back()->with('success', __('security.2fa.recovery.updated'));
    }
}
