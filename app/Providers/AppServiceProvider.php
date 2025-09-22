<?php

namespace App\Providers;

use App\Events\InvoicePaid;
use App\Events\InvoiceReopened;
use App\Listeners\QueueThemeCookieOnLogin;
use App\Listeners\UpdateContractStatusOnInvoicePaid;
use App\Listeners\UpdateContractStatusOnInvoiceReopened;
use App\Services\Contracts\ContractServiceInterface;
use App\Services\Contracts\InvoiceServiceInterface;
use App\Services\Contracts\MenuServiceInterface;
use App\Services\Contracts\PaymentServiceInterface;
use App\Services\Contracts\TwoFactorServiceInterface;
use App\Services\ContractService;
use App\Services\InvoiceService;
use App\Services\MenuService;
use App\Services\Midtrans\Contracts\MidtransGatewayInterface;
use App\Services\Midtrans\MidtransService;
use App\Services\PaymentService;
use App\Services\TwoFactorService;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
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
        $this->app->bind(ContractServiceInterface::class, ContractService::class);
        $this->app->bind(InvoiceServiceInterface::class, InvoiceService::class);
        $this->app->bind(PaymentServiceInterface::class, PaymentService::class);
        $this->app->bind(MidtransGatewayInterface::class, MidtransService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Domain events registration
        Event::listen(InvoicePaid::class, UpdateContractStatusOnInvoicePaid::class);
        Event::listen(InvoiceReopened::class, UpdateContractStatusOnInvoiceReopened::class);

        // Auth events
        Event::listen(Login::class, QueueThemeCookieOnLogin::class);
    }
}
