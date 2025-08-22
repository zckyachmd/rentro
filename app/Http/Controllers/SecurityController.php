<?php

namespace App\Http\Controllers;

use App\Http\Requests\Security\UpdatePasswordRequest;
use App\Traits\LogActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class SecurityController extends Controller
{
    use LogActivity;

    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();

        return Inertia::render('security/index', [
            'status'  => session('status'),
            'summary' => [
                'email_verified'           => !is_null($user->email_verified_at),
                'two_factor_enabled'       => !empty($user->two_factor_secret) && !empty($user->two_factor_confirmed_at),
                'last_password_changed_at' => $user->password_changed_at ?? null,
            ],
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = $request->user();
        $user->forceFill([
            'password'            => Hash::make($validated['password']),
            'password_changed_at' => now(),
        ])->save();

        $this->logEvent(
            event: 'security.password_updated',
            subject: $user,
            logName: 'security',
        );

        return back()->with('status', 'password-updated');
    }
}
