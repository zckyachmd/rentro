<?php

namespace App\Providers;

use App\Enum\RoleName;
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
}
