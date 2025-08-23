<?php

namespace App\Providers;

use App\Services\Contracts\MenuServiceInterface;
use App\Services\Contracts\TwoFactorServiceInterface;
use App\Services\MenuService;
use App\Services\TwoFactorService;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(TwoFactorServiceInterface::class, TwoFactorService::class);
        $this->app->bind(MenuServiceInterface::class, MenuService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
