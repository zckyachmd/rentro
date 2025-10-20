<?php

namespace App\Providers;

use App\Support\AppFeatures;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Load conditional public routes under 'web' middleware
        Route::middleware('web')->group(function (): void {
            if (AppFeatures::publicEnabled()) {
                require base_path('routes/public.php');
            } else {
                // When public disabled, redirect root to dashboard and keep name('home')
                Route::get('/', function () {
                    return redirect()->route('dashboard');
                })->name('home');
            }
        });
    }
}
