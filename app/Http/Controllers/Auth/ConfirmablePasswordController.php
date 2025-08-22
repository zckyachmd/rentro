<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ConfirmPasswordRequest;
use App\Traits\LogActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ConfirmablePasswordController extends Controller
{
    use LogActivity;

    /**
     * Show the confirm password view.
     */
    public function show(): Response
    {
        return Inertia::render('auth/confirm-password');
    }

    /**
     * Check whether password confirmation is required per current session timeout.
     */
    public function needs(Request $request): JsonResponse
    {
        $confirmedAt = (int) $request->session()->get('auth.password_confirmed_at', 0);
        $timeout     = (int) config('auth.password_timeout', 10800);
        $required    = $confirmedAt === 0 || (time() - $confirmedAt) > $timeout;

        return response()->json(['required' => $required]);
    }

    /**
     * Confirm the user's password.
     */
    public function store(ConfirmPasswordRequest $request): \Symfony\Component\HttpFoundation\Response
    {
        if (
            !Auth::guard('web')->validate([
                'email'    => $request->user()->email,
                'password' => $request->validated('password'),
            ])
        ) {
            throw ValidationException::withMessages([
                'password' => __('auth.password'),
            ]);
        }

        $request->session()->put('auth.password_confirmed_at', time());

        $this->logAuth('password_confirmed', $request->user());

        if ($request->header('X-Inertia')) {
            return response()->noContent();
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
