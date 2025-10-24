<?php

namespace App\Http\Controllers\Auth;

use App\Enum\RoleName;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Traits\LogActivity;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class RegisteredUserController extends Controller
{
    use LogActivity;

    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(RegisterRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name'     => $validated['name'],
            'username' => $validated['username'],
            'email'    => $validated['email'],
            'password' => $validated['password'],
        ]);

        // Ensure default role exists in testing/dev
        Role::findOrCreate(RoleName::TENANT->value);
        $user->assignRole(RoleName::TENANT->value);

        event(new Registered($user));

        // Keep user on login so they can verify email before accessing dashboard
        return redirect()->route('login')->with('success', __('auth.registered'));
    }
}
