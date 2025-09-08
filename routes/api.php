<?php

use App\Http\Controllers\Webhook\MidtransWebhookController;
use Illuminate\Support\Facades\Route;

Route::prefix('webhooks/midtrans')->name('webhooks.midtrans.')
    ->group(function (): void {
        Route::post('/', [MidtransWebhookController::class, 'handle'])->name('index');
        Route::post('/recurring', [MidtransWebhookController::class, 'handleRecurring'])->name('recurring');
    });
