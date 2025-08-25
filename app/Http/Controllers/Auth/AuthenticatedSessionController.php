<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Traits\LogActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    use LogActivity;

    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('auth/login', [
            'status'           => session('status'),
            'canResetPassword' => Route::has('password.request'),
            'canRegister'      => Route::has('register'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request)
    {
        $data = $request->validated();

        $rawLogin = trim((string) ($data['login'] ?? $data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        $field = filter_var($rawLogin, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $value = $field === 'username' ? mb_strtolower($rawLogin) : $rawLogin;

        $user = User::where($field, $value)->first();
        if (!$user && $field === 'username') {
            $user = User::where('name', $value)->first();
        }

        if (!$user || !Auth::validate([$field => $value, 'password' => $password])) {
            return back()->withErrors(['login' => __('auth.failed')]);
        }

        if (!empty($user->two_factor_secret) && !empty($user->two_factor_confirmed_at)) {
            Session::put('2fa:user:id', $user->id);
            Session::put('2fa:remember', (bool) ($data['remember'] ?? false));
            Session::put('2fa:expires_at', now()->addMinutes(config('twofactor.session_expire', 10))->toISOString());
            $request->session()->put('url.intended', route('dashboard'));

            return Inertia::location(route('twofactor.index'));
        }

        Auth::attempt([$field => $value, 'password' => $password], (bool) ($data['remember'] ?? false));
        $request->session()->regenerate();

        $this->logAuth('login', $user);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $this->logAuth('logout', $user);

        return redirect('/');
    }
}
