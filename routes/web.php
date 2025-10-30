<?php

use App\Enum\RoleName;
use App\Enum\PermissionName;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DiagnosticsController;
use App\Http\Controllers\NotificationController as UserNotificationController;
use App\Http\Controllers\PaymentRedirectController;
use App\Http\Controllers\PreferencesController;
use App\Http\Controllers\Profile\EmergencyContactController;
use App\Http\Controllers\Profile\ProfileController;
use App\Http\Controllers\Security\SecurityController;
use App\Http\Controllers\Security\TwoFactorController;
use App\Http\Controllers\Tenant\BookingController as TenantBookingController;
use App\Http\Controllers\Tenant\ContractController as TenantContractController;
use App\Http\Controllers\Tenant\HandoverController as TenantHandoverController;
use App\Http\Controllers\Tenant\InvoiceController as TenantInvoiceController;
use App\Http\Controllers\Tenant\MidtransController as TenantMidtransController;
use App\Http\Controllers\Tenant\PaymentController as TenantPaymentController;
use App\Http\Controllers\Tenant\RoomBrowseController as TenantRoomBrowseController;
use App\Http\Controllers\Webhook\MidtransWebhookController;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Route;

// Preferences (visual + language)
Route::prefix('preferences')
    ->name('preferences.')
    ->middleware('throttle:ui-preferences')
    ->group(function (): void {
        Route::post('/theme', [PreferencesController::class, 'updateTheme'])->name('theme');
        Route::post('/locale', [PreferencesController::class, 'updateLocale'])->name('locale');
    });

// Payment redirect endpoints (generic + provider-specific)
Route::prefix('payments')->name('payments.')->group(function (): void {
    // Generic redirect routes
    Route::prefix('redirect')->name('redirect.')->group(function (): void {
        // /payments/redirect/{status}
        Route::get('/{status}', [PaymentRedirectController::class, 'status'])
            ->where('status', 'finish|unfinish|error')
            ->name('status');
        // /payments/redirect/{provider}/{status}
        Route::get('/{provider}/{status}', [PaymentRedirectController::class, 'providerStatus'])
            ->where('status', 'finish|unfinish|error')
            ->name('provider.status');
    });
});

// Midtrans webhooks
Route::prefix('webhooks/midtrans')
    ->name('webhooks.midtrans.')
    ->withoutMiddleware([VerifyCsrfToken::class])
    ->group(function (): void {
        Route::post('/', [MidtransWebhookController::class, 'handle'])->name('index');
        Route::post('/recurring', [MidtransWebhookController::class, 'handleRecurring'])->name('recurring');
    });

if (config('diagnostics.proxy_debug_enabled')) {
    Route::get('/__diag/proxy', [DiagnosticsController::class, 'proxy'])
        ->withoutMiddleware([VerifyCsrfToken::class])
        ->name('diag.proxy');
}

Route::middleware('auth')->group(function (): void {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    // Profile
    Route::prefix('profile')->name('profile.')->group(function (): void {
        Route::get('/', [ProfileController::class, 'index'])->name('index');
        Route::get('/edit', [ProfileController::class, 'edit'])->name('edit');
        Route::patch('/', [ProfileController::class, 'update'])->name('update');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');

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
            ->middleware('throttle:6,1')
            ->name('password.update');

        Route::prefix('sessions')->name('sessions.')->group(function (): void {
            Route::post('/revoke-others', [SecurityController::class, 'revokeOthers'])
                ->middleware(['password.confirm', 'throttle:secure-sensitive'])
                ->name('revokeOthers');

            Route::delete('/{id}', [SecurityController::class, 'destroySession'])
                ->middleware(['password.confirm', 'throttle:secure-sensitive'])
                ->name('destroy');
        });

        Route::prefix('2fa')->name('2fa.')->group(function (): void {
            Route::post('/start', [TwoFactorController::class, 'start'])
                ->middleware(['password.confirm', 'throttle:secure-sensitive'])
                ->name('start');
            Route::get('/qr', [TwoFactorController::class, 'qr'])->name('qr');
            Route::post('/cancel', [TwoFactorController::class, 'cancel'])
                ->middleware(['password.confirm', 'throttle:secure-sensitive'])
                ->name('cancel');
            Route::post('/confirm', [TwoFactorController::class, 'confirm'])
                ->middleware(['password.confirm', 'throttle:6,1'])
                ->name('confirm');
            Route::delete('/disable', [TwoFactorController::class, 'disable'])
                ->middleware(['password.confirm', 'throttle:secure-sensitive'])
                ->name('disable');

            Route::prefix('recovery-codes')->name('recovery.')->group(function (): void {
                Route::get('/', [TwoFactorController::class, 'recoveryCode'])->name('index');
                Route::post('/regenerate', [TwoFactorController::class, 'recoveryRegenerate'])
                    ->middleware(['password.confirm', 'throttle:secure-2fa-recovery'])
                    ->name('regenerate');
            });
        });
    });

    // Tenant
    Route::prefix('tenant')->name('tenant.')->group(function (): void {
        // Default tenant home -> bookings list
        Route::get('/', function () {
            return redirect()->route('tenant.bookings.index');
        })->name('home');
        // Rooms browse (tenant scope)
        Route::prefix('rooms')->name('rooms.')->group(function (): void {
            Route::get('/', [TenantRoomBrowseController::class, 'index'])
                ->middleware('can:' . PermissionName::TENANT_ROOMS_VIEW->value)
                ->name('index');
            Route::get('/{room}', [TenantRoomBrowseController::class, 'show'])
                ->middleware('can:' . PermissionName::TENANT_ROOMS_VIEW->value)
                ->whereNumber('room')
                ->name('show');
        });
        // Bookings
        Route::prefix('bookings')->name('bookings.')->group(function (): void {
            Route::get('/', [TenantBookingController::class, 'index'])
                ->middleware('can:' . PermissionName::TENANT_BOOKING_VIEW->value)
                ->name('index');
            Route::get('/{booking}', [TenantBookingController::class, 'show'])
                ->middleware('can:' . PermissionName::TENANT_BOOKING_VIEW->value)
                ->whereNumber('booking')
                ->name('show');
            Route::post('/', [TenantBookingController::class, 'store'])
                ->middleware('can:' . PermissionName::TENANT_BOOKING_CREATE->value)
                ->name('store');
        });

        // Contracts
        Route::prefix('contracts')->name('contracts.')->group(function (): void {
            Route::get('/', [TenantContractController::class, 'index'])
                ->middleware('can:' . PermissionName::TENANT_CONTRACT_VIEW->value)
                ->name('index');
            Route::get('/{contract}', [TenantContractController::class, 'show'])
                ->middleware('can:' . PermissionName::TENANT_CONTRACT_VIEW->value)
                ->name('show');
            Route::get('/{contract}/print', [TenantContractController::class, 'print'])
                ->middleware('can:' . PermissionName::TENANT_CONTRACT_VIEW->value)
                ->name('print');
            Route::post('/{contract}/stop-auto-renew', [TenantContractController::class, 'stopAutoRenew'])
                ->middleware('can:' . PermissionName::TENANT_CONTRACT_STOP_RENEW->value)
                ->name('stopAutoRenew');
            Route::get('/{contract}/handovers', [TenantHandoverController::class, 'index'])
                ->middleware('can:' . PermissionName::TENANT_HANDOVER_VIEW->value)
                ->name('handovers.index');
        });

        // Tenant Handovers
        Route::prefix('handovers')->name('handovers.')->group(function (): void {
            Route::get('/{handover}/attachments/{path}', [TenantHandoverController::class, 'attachmentGeneral'])
                ->middleware('can:' . PermissionName::TENANT_HANDOVER_VIEW->value)
                ->where('path', '.*')
                ->whereNumber('handover')
                ->name('attachments.general');
            Route::post('/{handover}/ack', [TenantHandoverController::class, 'acknowledge'])
                ->middleware('can:' . PermissionName::TENANT_HANDOVER_ACK->value)
                ->whereNumber('handover')
                ->name('ack');
            Route::post('/{handover}/dispute', [TenantHandoverController::class, 'dispute'])
                ->middleware('can:' . PermissionName::TENANT_HANDOVER_DISPUTE->value)
                ->whereNumber('handover')
                ->name('dispute');
        });

        // Invoices
        Route::prefix('invoices')->name('invoices.')->group(function (): void {
            Route::get('/', [TenantInvoiceController::class, 'index'])
                ->middleware('can:' . PermissionName::TENANT_INVOICE_VIEW->value)
                ->name('index');
            Route::get('/{invoice}', [TenantInvoiceController::class, 'show'])
                ->middleware('can:' . PermissionName::TENANT_INVOICE_VIEW->value)
                ->whereNumber('invoice')
                ->name('show');
            Route::get('/{invoice}/print', [TenantInvoiceController::class, 'print'])
                ->middleware('can:' . PermissionName::TENANT_INVOICE_VIEW->value)
                ->whereNumber('invoice')
                ->name('print');
            Route::get('/{invoice}/pay/status', [TenantMidtransController::class, 'status'])
                ->middleware(['can:' . PermissionName::TENANT_INVOICE_VIEW->value, 'throttle:secure-tenant-status'])
                ->whereNumber('invoice')
                ->name('pay.status');
            Route::post('/{invoice}/pay/cancel', [TenantMidtransController::class, 'cancelPending'])
                ->middleware(['can:' . PermissionName::TENANT_INVOICE_PAY->value, 'throttle:secure-tenant-pay'])
                ->whereNumber('invoice')
                ->name('pay.cancel');
            Route::post('/{invoice}/pay/midtrans/va', [TenantMidtransController::class, 'payVa'])
                ->middleware(['can:' . PermissionName::TENANT_INVOICE_PAY->value, 'throttle:secure-tenant-pay'])
                ->whereNumber('invoice')
                ->name('pay.midtrans.va');
            Route::post('/{invoice}/pay/manual', [TenantPaymentController::class, 'payManual'])
                ->middleware(['can:' . PermissionName::TENANT_INVOICE_PAY->value, 'throttle:secure-tenant-pay'])
                ->whereNumber('invoice')
                ->name('pay.manual');
            Route::get('/payments/{payment}', [TenantPaymentController::class, 'show'])
                ->middleware('can:' . PermissionName::TENANT_PAYMENT_VIEW->value)
                ->whereNumber('payment')
                ->name('payments.show');
            Route::get('/payments/{payment}/attachment', [TenantPaymentController::class, 'attachment'])
                ->middleware('can:' . PermissionName::TENANT_PAYMENT_VIEW->value)
                ->whereNumber('payment')
                ->name('payments.attachment');
        });
    });

    // User Notifications
    Route::prefix('notifications')->name('notifications.')->middleware(['verified'])->group(function (): void {
        Route::get('/', [UserNotificationController::class, 'index'])->name('index');
        Route::get('/summary', [UserNotificationController::class, 'summary'])
            ->middleware('throttle:60,1')
            ->name('summary');
        Route::put('/{id}/read', [UserNotificationController::class, 'markRead'])->name('read');
        Route::put('/read-all', [UserNotificationController::class, 'markAllRead'])->name('read_all');
    });

    // Management (extracted routes)
    require __DIR__ . '/management.php';
});

// Auth
require __DIR__ . '/auth.php';

// WifiDog routes extracted
require __DIR__ . '/wifi.php';
