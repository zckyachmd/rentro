<?php

use App\Enum\PermissionName;
use App\Enum\RoleName;
use App\Http\Controllers\Management\AmenityManagementController;
use App\Http\Controllers\Management\AnnouncementController;
use App\Http\Controllers\Management\AuditLogController;
use App\Http\Controllers\Management\BookingManagementController;
use App\Http\Controllers\Management\BuildingManagementController;
use App\Http\Controllers\Management\ContractManagementController;
use App\Http\Controllers\Management\FloorManagementController;
use App\Http\Controllers\Management\HandoverManagementController;
use App\Http\Controllers\Management\InvoiceManagementController;
use App\Http\Controllers\Management\PageContentController;
use App\Http\Controllers\Management\PaymentManagementController;
use App\Http\Controllers\Management\PromotionManagementController;
use App\Http\Controllers\Management\RoleManagementController;
use App\Http\Controllers\Management\RoomManagementController;
use App\Http\Controllers\Management\RoomPhotoManagementController;
use App\Http\Controllers\Management\RoomTypeManagementController;
use App\Http\Controllers\Management\TestimonyManagementController;
use App\Http\Controllers\Management\UserManagementController;
use Illuminate\Support\Facades\Route;

// Management
Route::prefix('management')->name('management.')->group(function (): void {
    // Announcements (role/global)
    Route::prefix('announcements')->name('announcements.')
        ->middleware('role:' . RoleName::SUPER_ADMIN->value . '|' . RoleName::OWNER->value . '|' . RoleName::MANAGER->value)
        ->group(function (): void {
            Route::get('/', [AnnouncementController::class, 'index'])
                ->name('index');
            Route::post('/', [AnnouncementController::class, 'store'])
                ->middleware('throttle:secure-sensitive')
                ->name('store');
            Route::post('/{announcement}/send-now', [AnnouncementController::class, 'sendNow'])
                ->middleware('throttle:secure-sensitive')
                ->whereNumber('announcement')
                ->name('send_now');
            Route::post('/{announcement}/resend', [AnnouncementController::class, 'resend'])
                ->middleware('throttle:secure-sensitive')
                ->whereNumber('announcement')
                ->name('resend');
            Route::post('/{announcement}/cancel', [AnnouncementController::class, 'cancelSchedule'])
                ->middleware('throttle:secure-sensitive')
                ->whereNumber('announcement')
                ->name('cancel_schedule');
            Route::post('/role', [AnnouncementController::class, 'role'])
                ->middleware('throttle:secure-sensitive')
                ->name('role');
            Route::post('/global', [AnnouncementController::class, 'global'])
                ->middleware('throttle:secure-sensitive')
                ->name('global');
        });
    // Bookings
    Route::prefix('bookings')->name('bookings.')->group(function (): void {
        Route::get('/', [BookingManagementController::class, 'index'])
            ->middleware('can:' . PermissionName::BOOKING_VIEW->value)
            ->name('index');
        Route::get('/export', [BookingManagementController::class, 'export'])
            ->middleware('can:' . PermissionName::BOOKING_VIEW->value)
            ->name('export');
        Route::get('/{booking}', [BookingManagementController::class, 'show'])
            ->middleware('can:' . PermissionName::BOOKING_VIEW->value)
            ->whereNumber('booking')
            ->name('show');
        Route::post('/{booking}/approve', [BookingManagementController::class, 'approve'])
            ->middleware(['can:' . PermissionName::BOOKING_APPROVE->value, 'throttle:secure-sensitive'])
            ->whereNumber('booking')
            ->name('approve');
        Route::post('/{booking}/reject', [BookingManagementController::class, 'reject'])
            ->middleware(['can:' . PermissionName::BOOKING_REJECT->value, 'throttle:secure-sensitive'])
            ->whereNumber('booking')
            ->name('reject');
    });
    // Pages (mini CMS)
    Route::prefix('pages')->name('pages.')
        ->middleware('role:' . \App\Enum\RoleName::SUPER_ADMIN->value . '|' . \App\Enum\RoleName::OWNER->value . '|' . \App\Enum\RoleName::MANAGER->value)
        ->group(function (): void {
            Route::get('/', [PageContentController::class, 'index'])
            ->name('index');
            Route::get('/{page}/{section}', [PageContentController::class, 'edit'])
            ->name('edit');
            Route::post('/{page}/{section}', [PageContentController::class, 'update'])
            ->name('update');
        });
    // Users
    Route::prefix('users')->name('users.')->group(function (): void {
        Route::get('/', [UserManagementController::class, 'index'])
            ->middleware('can:' . PermissionName::USER_VIEW->value)
            ->name('index');

        // Detail user + document verification
        Route::get('/{user}', [UserManagementController::class, 'show'])
            ->middleware('can:' . PermissionName::USER_VIEW->value)
            ->whereNumber('user')
            ->name('show');

        // View user document attachments (private files)
        Route::get('/{user}/document/attachments/{path}', [UserManagementController::class, 'documentAttachment'])
            ->middleware('can:' . PermissionName::USER_VIEW->value)
            ->where('path', '.*')
            ->name('document.attachment');

        // Verify user document (requires dedicated permission)
        Route::post('/{user}/document/approve', [UserManagementController::class, 'approveDocument'])
            ->middleware('can:' . PermissionName::USER_DOCUMENT_VERIFY->value)
            ->name('document.approve');
        Route::post('/{user}/document/reject', [UserManagementController::class, 'rejectDocument'])
            ->middleware('can:' . PermissionName::USER_DOCUMENT_VERIFY->value)
            ->name('document.reject');

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
        Route::get('/export', [ContractManagementController::class, 'export'])
            ->middleware('can:' . PermissionName::CONTRACT_VIEW->value)
            ->name('export');
        Route::get('/create', [ContractManagementController::class, 'create'])
            ->middleware('can:' . PermissionName::CONTRACT_CREATE->value)
            ->name('create');
        Route::post('/', [ContractManagementController::class, 'store'])
            ->middleware('can:' . PermissionName::CONTRACT_CREATE->value)
            ->name('store');
        Route::get('/{contract}', [ContractManagementController::class, 'show'])
            ->middleware('can:' . PermissionName::CONTRACT_VIEW->value)
            ->name('show');
        Route::get('/{contract}/print', [ContractManagementController::class, 'print'])
            ->middleware('can:' . PermissionName::CONTRACT_VIEW->value)
            ->name('print');
        Route::post('/{contract}/cancel', [ContractManagementController::class, 'cancel'])
            ->middleware('can:' . PermissionName::CONTRACT_CANCEL->value)
            ->name('cancel');
        Route::post('/{contract}/set-auto-renew', [ContractManagementController::class, 'setAutoRenew'])
            ->middleware('can:' . PermissionName::CONTRACT_RENEW->value)
            ->name('setAutoRenew');

        // Handover (Check-in/Check-out) management
        Route::get('/{contract}/handovers', [HandoverManagementController::class, 'index'])
            ->middleware('can:' . PermissionName::HANDOVER_VIEW->value)
            ->name('handovers.index');
        Route::post('/{contract}/checkin', [HandoverManagementController::class, 'checkin'])
            ->middleware('can:' . PermissionName::HANDOVER_CREATE->value)
            ->name('handovers.checkin');
        Route::post('/{contract}/checkout', [HandoverManagementController::class, 'checkout'])
            ->middleware('can:' . PermissionName::HANDOVER_CREATE->value)
            ->name('handovers.checkout');
    });

    // Handovers
    Route::get('/handovers/{handover}/attachments/{path}', [HandoverManagementController::class, 'attachmentGeneral'])
        ->middleware('can:' . PermissionName::HANDOVER_VIEW->value)
        ->where('path', '.*')
        ->name('handovers.attachment.general');

    // Invoices
    Route::prefix('invoices')->name('invoices.')->group(function (): void {
        Route::get('/', [InvoiceManagementController::class, 'index'])
            ->middleware('can:' . PermissionName::INVOICE_VIEW->value)
            ->name('index');
        Route::get('/export', [InvoiceManagementController::class, 'export'])
            ->middleware('can:' . PermissionName::INVOICE_VIEW->value)
            ->name('export');
        Route::get('/{invoice}', [InvoiceManagementController::class, 'show'])
            ->middleware('can:' . PermissionName::INVOICE_VIEW->value)
            ->whereNumber('invoice')
            ->name('show');
        Route::get('/lookup', [InvoiceManagementController::class, 'lookup'])
            ->middleware('can:' . PermissionName::INVOICE_VIEW->value)
            ->name('lookup');
        Route::post('/generate', [InvoiceManagementController::class, 'generate'])
            ->middleware(['can:' . PermissionName::INVOICE_CREATE->value, 'throttle:secure-sensitive'])
            ->name('generate');
        Route::get('/{invoice}/print', [InvoiceManagementController::class, 'print'])
            ->middleware('can:' . PermissionName::INVOICE_VIEW->value)
            ->whereNumber('invoice')
            ->name('print');
        Route::post('/{invoice}/extend-due', [InvoiceManagementController::class, 'extendDue'])
            ->middleware(['can:' . PermissionName::INVOICE_UPDATE->value, 'throttle:secure-sensitive'])
            ->whereNumber('invoice')
            ->name('extendDue');
        Route::post('/{invoice}/cancel', [InvoiceManagementController::class, 'cancel'])
            ->middleware(['can:' . PermissionName::INVOICE_UPDATE->value, 'throttle:secure-sensitive'])
            ->whereNumber('invoice')
            ->name('cancel');
    });

    // Payments
    Route::prefix('payments')->name('payments.')->group(function (): void {
        Route::get('/', [PaymentManagementController::class, 'index'])
            ->middleware('can:' . PermissionName::PAYMENT_VIEW->value)
            ->name('index');
        Route::get('/export', [PaymentManagementController::class, 'export'])
            ->middleware('can:' . PermissionName::PAYMENT_VIEW->value)
            ->name('export');
        Route::get('/{payment}', [PaymentManagementController::class, 'show'])
            ->middleware('can:' . PermissionName::PAYMENT_VIEW->value)
            ->name('show');
        Route::post('/', [PaymentManagementController::class, 'store'])
            ->middleware(['can:' . PermissionName::PAYMENT_CREATE->value, 'throttle:secure-sensitive'])
            ->name('store');
        Route::get('/{payment}/attachment', [PaymentManagementController::class, 'attachment'])
            ->middleware('can:' . PermissionName::PAYMENT_VIEW->value)
            ->name('attachment');
        Route::get('/{payment}/print', [PaymentManagementController::class, 'print'])
            ->middleware('can:' . PermissionName::PAYMENT_VIEW->value)
            ->name('print');
        Route::post('/{payment}/void', [PaymentManagementController::class, 'void'])
            ->middleware(['can:' . PermissionName::PAYMENT_UPDATE->value, 'throttle:secure-sensitive'])
            ->name('void');
        Route::post('/{payment}/ack', [PaymentManagementController::class, 'ack'])
            ->middleware(['can:' . PermissionName::PAYMENT_UPDATE->value, 'throttle:secure-sensitive'])
            ->name('ack');
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

    // Promotions
    Route::prefix('promotions')->name('promotions.')->group(function (): void {
        Route::get('/', [PromotionManagementController::class, 'index'])
            ->middleware('can:' . PermissionName::PROMOTION_VIEW->value)
            ->name('index');

        Route::get('/{promotion}', [PromotionManagementController::class, 'show'])
            ->middleware('can:' . PermissionName::PROMOTION_VIEW->value)
            ->whereNumber('promotion')
            ->name('show');

        Route::post('/', [PromotionManagementController::class, 'store'])
            ->middleware('can:' . PermissionName::PROMOTION_CREATE->value)
            ->name('store');

        Route::put('/{promotion}', [PromotionManagementController::class, 'update'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->name('update');

        Route::delete('/{promotion}', [PromotionManagementController::class, 'destroy'])
            ->middleware('can:' . PermissionName::PROMOTION_DELETE->value)
            ->name('destroy');

        // Scopes
        Route::post('/{promotion}/scopes', [PromotionManagementController::class, 'storeScope'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->name('scopes.store');
        Route::post('/{promotion}/scopes/bulk', [PromotionManagementController::class, 'storeScopesBulk'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->name('scopes.bulk');
        Route::put('/scopes/{scope}', [PromotionManagementController::class, 'updateScope'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->whereNumber('scope')
            ->name('scopes.update');
        Route::delete('/scopes/{scope}', [PromotionManagementController::class, 'destroyScope'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->whereNumber('scope')
            ->name('scopes.destroy');

        // Rules
        Route::post('/{promotion}/rules', [PromotionManagementController::class, 'storeRule'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->name('rules.store');
        Route::put('/rules/{rule}', [PromotionManagementController::class, 'updateRule'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->whereNumber('rule')
            ->name('rules.update');
        Route::delete('/rules/{rule}', [PromotionManagementController::class, 'destroyRule'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->whereNumber('rule')
            ->name('rules.destroy');

        // Actions
        Route::post('/{promotion}/actions', [PromotionManagementController::class, 'storeAction'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->name('actions.store');
        Route::put('/actions/{action}', [PromotionManagementController::class, 'updateAction'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->whereNumber('action')
            ->name('actions.update');
        Route::delete('/actions/{action}', [PromotionManagementController::class, 'destroyAction'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->whereNumber('action')
            ->name('actions.destroy');

        // Coupons
        Route::get('/coupons/lookup', [PromotionManagementController::class, 'lookupCoupons'])
            ->middleware('can:' . PermissionName::PROMOTION_VIEW->value)
            ->name('coupons.lookup');
        Route::get('/{promotion}/coupons/list', [PromotionManagementController::class, 'listCoupons'])
            ->middleware('can:' . PermissionName::PROMOTION_VIEW->value)
            ->name('coupons.list');
        Route::post('/{promotion}/coupons', [PromotionManagementController::class, 'storeCoupon'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->name('coupons.store');
        Route::post('/{promotion}/coupons/bulk', [PromotionManagementController::class, 'storeCouponsBulk'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->name('coupons.bulk');
        Route::get('/{promotion}/coupons/export', [PromotionManagementController::class, 'exportCoupons'])
            ->middleware('can:' . PermissionName::PROMOTION_VIEW->value)
            ->name('coupons.export');
        Route::put('/coupons/{coupon}', [PromotionManagementController::class, 'updateCoupon'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->whereNumber('coupon')
            ->name('coupons.update');
        Route::delete('/coupons/{coupon}', [PromotionManagementController::class, 'destroyCoupon'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->whereNumber('coupon')
            ->name('coupons.destroy');

        // Guides (TnC/How) template generator
        Route::post('/{promotion}/guides/generate', [PromotionManagementController::class, 'generateGuides'])
            ->middleware('can:' . PermissionName::PROMOTION_UPDATE->value)
            ->name('guides.generate');
        Route::get('/{promotion}/guides/preview', [PromotionManagementController::class, 'previewGuides'])
            ->middleware('can:' . PermissionName::PROMOTION_VIEW->value)
            ->name('guides.preview');
    });

    // Testimonies
    Route::prefix('testimonies')->name('testimonies.')->group(function (): void {
        Route::get('/', [TestimonyManagementController::class, 'index'])
            ->middleware('can:' . PermissionName::TESTIMONY_VIEW->value)
            ->name('index');
        Route::put('/{testimony}', [TestimonyManagementController::class, 'update'])
            ->middleware('can:' . PermissionName::TESTIMONY_UPDATE->value)
            ->name('update');
        Route::delete('/{testimony}', [TestimonyManagementController::class, 'destroy'])
            ->middleware('can:' . PermissionName::TESTIMONY_DELETE->value)
            ->name('destroy');
    });
});
