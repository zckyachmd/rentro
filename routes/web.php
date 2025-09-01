<?php

use App\Enum\PermissionName;
use App\Enum\RoleName;
use App\Http\Controllers\Management\AmenityManagementController;
use App\Http\Controllers\Management\AuditLogController;
use App\Http\Controllers\Management\BuildingManagementController;
use App\Http\Controllers\Management\ContractManagementController;
use App\Http\Controllers\Management\FloorManagementController;
use App\Http\Controllers\Management\InvoiceManagementController;
use App\Http\Controllers\Management\PaymentManagementController;
use App\Http\Controllers\Management\RoleManagementController;
use App\Http\Controllers\Management\RoomManagementController;
use App\Http\Controllers\Management\RoomPhotoManagementController;
use App\Http\Controllers\Management\RoomTypeManagementController;
use App\Http\Controllers\Management\UserManagementController;
use App\Http\Controllers\Profile\EmergencyContactController;
use App\Http\Controllers\Profile\ProfileController;
use App\Http\Controllers\Security\SecurityController;
use App\Http\Controllers\Security\TwoFactorController;
use App\Http\Controllers\Tenant\BookingController as TenantBookingController;
use App\Http\Controllers\Tenant\ContractController as TenantContractController;
use App\Http\Controllers\Tenant\InvoiceController as TenantInvoiceController;
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

    // Tenant
    Route::prefix('tenant')->name('tenant.')->middleware(['role:' . RoleName::TENANT->value])->group(function (): void {
        Route::get('/bookings', [TenantBookingController::class, 'index'])->name('bookings.index');
        Route::get('/contracts', [TenantContractController::class, 'index'])->name('contracts.index');
        Route::get('/invoices', [TenantInvoiceController::class, 'index'])->name('invoices.index');
    });

    // Management
    Route::prefix('management')->name('management.')->group(function (): void {
        // Users
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

        // Roles
        Route::prefix('roles')->name('roles.')->group(function (): void {
            Route::get('/', [RoleManagementController::class, 'index'])
                ->middleware('can:' . PermissionName::ROLE_VIEW->value)
                ->name('index');

            Route::post('/', [RoleManagementController::class, 'store'])
                ->middleware('can:' . PermissionName::ROLE_CREATE->value)
                ->name('store');

            Route::put('/{role}', [RoleManagementController::class, 'update'])
                ->middleware('can:' . PermissionName::ROLE_UPDATE->value)
                ->name('update');

            Route::delete('/{role}', [RoleManagementController::class, 'destroy'])
                ->middleware('can:' . PermissionName::ROLE_DELETE->value)
                ->name('destroy');

            Route::put('/{role}/permissions', [RoleManagementController::class, 'updatePermissions'])
                ->middleware('can:' . PermissionName::ROLE_PERMISSION_MANAGE->value)
                ->name('permissions.update');
        });

        // Audit Logs
        Route::prefix('audit-logs')->name('audit-logs.')->group(function (): void {
            Route::get('/', [AuditLogController::class, 'index'])
                ->middleware('can:' . PermissionName::AUDIT_LOG_VIEW->value)
                ->name('index');
        });

        // Contracts
        Route::prefix('contracts')->name('contracts.')->group(function (): void {
            Route::get('/', [ContractManagementController::class, 'index'])
                ->middleware('can:' . PermissionName::CONTRACT_VIEW->value)
                ->name('index');
            Route::get('/create', [ContractManagementController::class, 'create'])
                ->middleware('can:' . PermissionName::CONTRACT_CREATE->value)
                ->name('create');
            Route::post('/', [ContractManagementController::class, 'store'])
                ->middleware('can:' . PermissionName::CONTRACT_CREATE->value)
                ->name('store');
            Route::put('/{contract}', [ContractManagementController::class, 'update'])
                ->middleware('can:' . PermissionName::CONTRACT_UPDATE->value)
                ->name('update');
            Route::delete('/{contract}', [ContractManagementController::class, 'destroy'])
                ->middleware('can:' . PermissionName::CONTRACT_DELETE->value)
                ->name('destroy');

            // Contract actions
            Route::post('/{contract}/cancel', [ContractManagementController::class, 'cancel'])
                ->middleware('can:' . PermissionName::CONTRACT_UPDATE->value)
                ->name('cancel');
            Route::post('/{contract}/extend-due', [ContractManagementController::class, 'extendDue'])
                ->middleware('can:' . PermissionName::CONTRACT_UPDATE->value)
                ->name('extendDue');
            Route::post('/{contract}/stop-auto-renew', [ContractManagementController::class, 'stopAutoRenew'])
                ->middleware('can:' . PermissionName::CONTRACT_UPDATE->value)
                ->name('stopAutoRenew');
            Route::post('/{contract}/start-auto-renew', [ContractManagementController::class, 'startAutoRenew'])
                ->middleware('can:' . PermissionName::CONTRACT_UPDATE->value)
                ->name('startAutoRenew');
        });

        // Invoices
        Route::prefix('invoices')->name('invoices.')->group(function (): void {
            Route::get('/', [InvoiceManagementController::class, 'index'])
                ->middleware('can:' . PermissionName::INVOICE_VIEW->value)
                ->name('index');
            Route::post('/', [InvoiceManagementController::class, 'store'])
                ->middleware('can:' . PermissionName::INVOICE_CREATE->value)
                ->name('store');
            Route::put('/{invoice}', [InvoiceManagementController::class, 'update'])
                ->middleware('can:' . PermissionName::INVOICE_UPDATE->value)
                ->name('update');
            Route::delete('/{invoice}', [InvoiceManagementController::class, 'destroy'])
                ->middleware('can:' . PermissionName::INVOICE_DELETE->value)
                ->name('destroy');
        });

        // Payments
        Route::prefix('payments')->name('payments.')->group(function (): void {
            Route::get('/', [PaymentManagementController::class, 'index'])
                ->middleware('can:' . PermissionName::PAYMENT_VIEW->value)
                ->name('index');
            Route::post('/', [PaymentManagementController::class, 'store'])
                ->middleware('can:' . PermissionName::PAYMENT_CREATE->value)
                ->name('store');
            Route::put('/{payment}', [PaymentManagementController::class, 'update'])
                ->middleware('can:' . PermissionName::PAYMENT_UPDATE->value)
                ->name('update');
            Route::delete('/{payment}', [PaymentManagementController::class, 'destroy'])
                ->middleware('can:' . PermissionName::PAYMENT_DELETE->value)
                ->name('destroy');
        });

        // Rooms
        Route::prefix('rooms')->name('rooms.')->group(function (): void {
            Route::get('/', [RoomManagementController::class, 'index'])
                ->middleware('can:' . PermissionName::ROOM_MANAGE_VIEW->value)
                ->name('index');

            Route::get('/create', [RoomManagementController::class, 'create'])
                ->middleware('can:' . PermissionName::ROOM_MANAGE_CREATE->value)
                ->name('create');

            Route::get('/{room}', [RoomManagementController::class, 'show'])
                ->middleware('can:' . PermissionName::ROOM_MANAGE_VIEW->value)
                ->name('show');

            Route::get('/{room}/edit', [RoomManagementController::class, 'edit'])
                ->middleware('can:' . PermissionName::ROOM_MANAGE_UPDATE->value)
                ->name('edit');

            Route::post('/', [RoomManagementController::class, 'store'])
                ->middleware('can:' . PermissionName::ROOM_MANAGE_CREATE->value)
                ->name('store');

            Route::put('/{room}', [RoomManagementController::class, 'update'])
                ->middleware('can:' . PermissionName::ROOM_MANAGE_UPDATE->value)
                ->name('update');

            Route::delete('/{room}', [RoomManagementController::class, 'destroy'])
                ->middleware('can:' . PermissionName::ROOM_MANAGE_DELETE->value)
                ->name('destroy');

            // Room Photos
            Route::prefix('{room}/photos')->name('photos.')->group(function (): void {
                Route::get('/', [RoomPhotoManagementController::class, 'index'])
                    ->middleware('can:' . PermissionName::ROOM_PHOTO_VIEW->value)
                    ->name('index');

                Route::post('/', [RoomPhotoManagementController::class, 'store'])
                    ->middleware('can:' . PermissionName::ROOM_PHOTO_CREATE->value)
                    ->name('store');

                Route::post('/batch', [RoomPhotoManagementController::class, 'batch'])
                    ->middleware('can:' . PermissionName::ROOM_PHOTO_CREATE->value)
                    ->name('batch');

                Route::delete('/{photo}', [RoomPhotoManagementController::class, 'destroy'])
                    ->middleware('can:' . PermissionName::ROOM_PHOTO_DELETE->value)
                    ->name('destroy');
            });
        });

        // Buildings
        Route::prefix('buildings')->name('buildings.')->group(function (): void {
            Route::get('/', [BuildingManagementController::class, 'index'])
                ->middleware('can:' . PermissionName::BUILDING_VIEW->value)
                ->name('index');

            Route::post('/', [BuildingManagementController::class, 'store'])
                ->middleware('can:' . PermissionName::BUILDING_CREATE->value)
                ->name('store');

            Route::put('/{building}', [BuildingManagementController::class, 'update'])
                ->middleware('can:' . PermissionName::BUILDING_UPDATE->value)
                ->name('update');

            Route::delete('/{building}', [BuildingManagementController::class, 'destroy'])
                ->middleware('can:' . PermissionName::BUILDING_DELETE->value)
                ->name('destroy');
        });

        // Floors
        Route::prefix('floors')->name('floors.')->group(function (): void {
            Route::get('/', [FloorManagementController::class, 'index'])
                ->middleware('can:' . PermissionName::FLOOR_VIEW->value)
                ->name('index');

            Route::post('/', [FloorManagementController::class, 'store'])
                ->middleware('can:' . PermissionName::FLOOR_CREATE->value)
                ->name('store');

            Route::put('/{floor}', [FloorManagementController::class, 'update'])
                ->middleware('can:' . PermissionName::FLOOR_UPDATE->value)
                ->name('update');

            Route::delete('/{floor}', [FloorManagementController::class, 'destroy'])
                ->middleware('can:' . PermissionName::FLOOR_DELETE->value)
                ->name('destroy');
        });

        // Room Types
        Route::prefix('room-types')->name('room-types.')->group(function (): void {
            Route::get('/', [RoomTypeManagementController::class, 'index'])
                ->middleware('can:' . PermissionName::ROOM_TYPE_VIEW->value)
                ->name('index');

            Route::post('/', [RoomTypeManagementController::class, 'store'])
                ->middleware('can:' . PermissionName::ROOM_TYPE_CREATE->value)
                ->name('store');

            Route::put('/{room_type}', [RoomTypeManagementController::class, 'update'])
                ->middleware('can:' . PermissionName::ROOM_TYPE_UPDATE->value)
                ->name('update');

            Route::delete('/{room_type}', [RoomTypeManagementController::class, 'destroy'])
                ->middleware('can:' . PermissionName::ROOM_TYPE_DELETE->value)
                ->name('destroy');
        });

        // Amenities
        Route::prefix('amenities')->name('amenities.')->group(function (): void {
            Route::get('/', [AmenityManagementController::class, 'index'])
                ->middleware('can:' . PermissionName::AMENITY_VIEW->value)
                ->name('index');

            Route::post('/', [AmenityManagementController::class, 'store'])
                ->middleware('can:' . PermissionName::AMENITY_CREATE->value)
                ->name('store');

            Route::put('/{amenity}', [AmenityManagementController::class, 'update'])
                ->middleware('can:' . PermissionName::AMENITY_UPDATE->value)
                ->name('update');

            Route::delete('/{amenity}', [AmenityManagementController::class, 'destroy'])
                ->middleware('can:' . PermissionName::AMENITY_DELETE->value)
                ->name('destroy');
        });
    });
});

require __DIR__ . '/auth.php';
