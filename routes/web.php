<?php

use App\Enum\PermissionName;
use App\Http\Controllers\Management\UserManagementController;
use App\Http\Controllers\Profile\EmergencyContactController;
use App\Http\Controllers\Profile\ProfileController;
use App\Http\Controllers\Security\SecurityController;
use App\Http\Controllers\Security\TwoFactorController;
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

    // Management
    Route::prefix('management')->name('management.')->group(function (): void {
        Route::prefix('users')->name('users.')->group(function (): void {
            Route::get('/', [UserManagementController::class, 'index'])
                ->middleware('can:' . PermissionName::USER_VIEW->value)
                ->name('index');

            Route::post('/', [UserManagementController::class, 'createUser'])
                ->middleware('can:' . PermissionName::USER_CREATE->value)
                ->name('store');

            Route::put('/{user}/roles', [UserManagementController::class, 'updateRoles'])
                ->middleware('can:' . PermissionName::USER_ROLE_MANAGE->value)
                ->name('roles.update');

            Route::post('/{user}/reset-password', [UserManagementController::class, 'resetPasswordLink'])
                ->middleware('can:' . PermissionName::USER_PASSWORD_RESET->value)
                ->name('password.reset');

            Route::post('/{user}/two-factor', [UserManagementController::class, 'twoFactor'])
                ->middleware('can:' . PermissionName::USER_TWO_FACTOR->value)
                ->name('two-factor');

            Route::delete('/{user}/force-logout', [UserManagementController::class, 'forceLogout'])
                ->middleware('can:' . PermissionName::USER_FORCE_LOGOUT->value)
                ->name('force-logout');
        });
    });
});

require __DIR__ . '/auth.php';
