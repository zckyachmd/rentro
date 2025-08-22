<?php

use App\Http\Controllers\EmergencyContactController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SecurityController;
use App\Http\Controllers\TwoFactorController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('welcome', [
    'canLogin'       => Route::has('login'),
    'canRegister'    => Route::has('register'),
    'laravelVersion' => Application::VERSION,
    'phpVersion'     => PHP_VERSION,
]));

Route::middleware('auth')->group(function (): void {
    Route::get('/dashboard', fn () => Inertia::render('dashboard'))
        ->name('dashboard');

    // Profile
    Route::prefix('profile')->name('profile.')->group(function (): void {
        Route::get('/', [ProfileController::class, 'show'])->name('show');
        Route::get('/edit', [ProfileController::class, 'edit'])->name('edit');
        Route::patch('/', [ProfileController::class, 'update'])->name('update');
        // Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');

        Route::prefix('emergency-contacts')->name('contacts.')->group(function (): void {
            Route::post('/', [EmergencyContactController::class, 'store'])->name('store');
            Route::put('/{contact}', [EmergencyContactController::class, 'update'])->name('update');
            Route::delete('/{contact}', [EmergencyContactController::class, 'destroy'])->name('destroy');
        });
    });

    // Security
    Route::prefix('security')->name('security.')->group(function (): void {
        Route::get('/', [SecurityController::class, 'index'])->name('index');

        Route::patch('/password', [SecurityController::class, 'updatePassword'])
            ->middleware('password.confirm')
            ->name('password.update');

        Route::prefix('sessions')->name('sessions.')->group(function (): void {
            Route::post('/revoke-others', [SecurityController::class, 'revokeOthers'])
                ->middleware('password.confirm')
                ->name('revokeOthers');

            Route::delete('/{id}', [SecurityController::class, 'destroySession'])
                ->middleware('password.confirm')
                ->name('destroy');
        });

        Route::prefix('2fa')->name('2fa.')->group(function (): void {
            Route::post('/start', [TwoFactorController::class, 'start'])
                ->middleware('password.confirm')
                ->name('start');
            Route::get('/qr', [TwoFactorController::class, 'qr'])->name('qr');
            Route::post('/cancel', [TwoFactorController::class, 'cancel'])
                ->middleware('password.confirm')
                ->name('cancel');
            Route::post('/confirm', [TwoFactorController::class, 'confirm'])
                ->middleware(['password.confirm', 'throttle:6,1'])
                ->name('confirm');
            Route::delete('/disable', [TwoFactorController::class, 'disable'])
                ->middleware('password.confirm')
                ->name('disable');

            Route::prefix('recovery-codes')->name('recovery.')->group(function (): void {
                Route::get('/', [TwoFactorController::class, 'recoveryCode'])->name('index');
                Route::post('/regenerate', [TwoFactorController::class, 'recoveryRegenerate'])
                    ->middleware('password.confirm')
                    ->name('regenerate');
            });
        });
    });
});

require __DIR__ . '/auth.php';
