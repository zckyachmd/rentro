<?php

namespace App\Providers;

use App\Models\EmergencyContact;
use App\Policies\EmergencyContactPolicy;
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
        //
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
