<?php

namespace App\Providers;

use App\Enum\RoleName;
use App\Models\EmergencyContact;
use App\Policies\EmergencyContactPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Gate::before(function ($user) {
            if ($user->hasRole(RoleName::SUPER_ADMIN->value)) {
                return true;
            }

            return null;
        });
    }

    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        EmergencyContact::class => EmergencyContactPolicy::class,
    ];
}
