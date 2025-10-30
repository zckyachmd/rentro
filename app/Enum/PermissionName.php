<?php

namespace App\Enum;

enum PermissionName: string
{
    // Tenant (self-service)
    case TENANT_ROOMS_VIEW          = 'tenant.rooms.view';
    case TENANT_BOOKING_VIEW        = 'tenant.booking.view';
    case TENANT_BOOKING_CREATE      = 'tenant.booking.create';
    case TENANT_CONTRACT_VIEW       = 'tenant.contract.view';
    case TENANT_CONTRACT_STOP_RENEW = 'tenant.contract.stop-auto-renew';
    case TENANT_HANDOVER_VIEW       = 'tenant.handover.view';
    case TENANT_HANDOVER_ACK        = 'tenant.handover.ack';
    case TENANT_HANDOVER_DISPUTE    = 'tenant.handover.dispute';
    case TENANT_INVOICE_VIEW        = 'tenant.invoice.view';
    case TENANT_INVOICE_PAY         = 'tenant.invoice.pay';
    case TENANT_PAYMENT_VIEW        = 'tenant.payment.view';

    // Akun
    case USER_VIEW            = 'user.view';
    case USER_CREATE          = 'user.create';
    case USER_ROLE_MANAGE     = 'user.role.manage';
    case USER_PASSWORD_RESET  = 'user.password.reset';
    case USER_TWO_FACTOR      = 'user.two-factor';
    case USER_FORCE_LOGOUT    = 'user.force-logout';
    case USER_DOCUMENT_VERIFY = 'user.document.verify';

    // Role
    case ROLE_VIEW              = 'role.view';
    case ROLE_CREATE            = 'role.create';
    case ROLE_UPDATE            = 'role.update';
    case ROLE_DELETE            = 'role.delete';
    case ROLE_PERMISSION_MANAGE = 'role.permission.manage';

    // Announcements
    case ANNOUNCEMENT_VIEW   = 'announcement.view';
    case ANNOUNCEMENT_CREATE = 'announcement.create';
    case ANNOUNCEMENT_SEND   = 'announcement.send';
    case ANNOUNCEMENT_CANCEL = 'announcement.cancel';

    // Pages (CMS)
    case PAGE_VIEW   = 'page.view';
    case PAGE_UPDATE = 'page.update';

    // Audit Log
    case AUDIT_LOG_VIEW = 'audit-log.view';

    // Kamar
    case ROOM_MANAGE_VIEW   = 'room.manage.view';
    case ROOM_MANAGE_CREATE = 'room.manage.create';
    case ROOM_MANAGE_UPDATE = 'room.manage.update';
    case ROOM_MANAGE_DELETE = 'room.manage.delete';

    // Room Photos
    case ROOM_PHOTO_VIEW   = 'room.photo.view';
    case ROOM_PHOTO_CREATE = 'room.photo.create';
    case ROOM_PHOTO_DELETE = 'room.photo.delete';

    // Buildings
    case BUILDING_VIEW   = 'building.view';
    case BUILDING_CREATE = 'building.create';
    case BUILDING_UPDATE = 'building.update';
    case BUILDING_DELETE = 'building.delete';

    // Floors
    case FLOOR_VIEW   = 'floor.view';
    case FLOOR_CREATE = 'floor.create';
    case FLOOR_UPDATE = 'floor.update';
    case FLOOR_DELETE = 'floor.delete';

    // Room Types
    case ROOM_TYPE_VIEW   = 'room-type.view';
    case ROOM_TYPE_CREATE = 'room-type.create';
    case ROOM_TYPE_UPDATE = 'room-type.update';
    case ROOM_TYPE_DELETE = 'room-type.delete';

    // Amenities
    case AMENITY_VIEW   = 'amenity.view';
    case AMENITY_CREATE = 'amenity.create';
    case AMENITY_UPDATE = 'amenity.update';
    case AMENITY_DELETE = 'amenity.delete';

    // Contracts
    case CONTRACT_VIEW   = 'contract.view';
    case CONTRACT_CREATE = 'contract.create';
    case CONTRACT_CANCEL = 'contract.cancel';
    case CONTRACT_RENEW  = 'contract.renew';

    // Bookings (management)
    case BOOKING_VIEW    = 'booking.view';
    case BOOKING_APPROVE = 'booking.approve';
    case BOOKING_REJECT  = 'booking.reject';

    // Invoices
    case INVOICE_VIEW   = 'invoice.view';
    case INVOICE_CREATE = 'invoice.create';
    case INVOICE_UPDATE = 'invoice.update';

    // Payments
    case PAYMENT_VIEW   = 'payment.view';
    case PAYMENT_CREATE = 'payment.create';
    case PAYMENT_UPDATE = 'payment.update';

    // Handover (Check-in/Check-out)
    case HANDOVER_VIEW   = 'handover.view';
    case HANDOVER_CREATE = 'handover.create';

    // Promotions
    case PROMOTION_VIEW   = 'promotion.view';
    case PROMOTION_CREATE = 'promotion.create';
    case PROMOTION_UPDATE = 'promotion.update';
    case PROMOTION_DELETE = 'promotion.delete';

    // Testimonies
    case TESTIMONY_VIEW   = 'testimony.view';
    case TESTIMONY_UPDATE = 'testimony.update';
    case TESTIMONY_DELETE = 'testimony.delete';

    /**
     * Get all tenant-related permissions (those starting with 'tenant.').
     *
     * @return array<int, string>
     */
    public static function tenantPermissions(): array
    {
        return array_values(array_map(
            fn ($p) => $p->value,
            array_filter(self::cases(), fn ($p) => str_starts_with($p->value, 'tenant.')),
        ));
    }

    /**
     * Get all management-side permissions (exclude those starting with 'tenant.').
     *
     * @return array<int, string>
     */
    public static function managementPermissions(): array
    {
        return array_values(array_map(
            fn ($p) => $p->value,
            array_filter(self::cases(), fn ($p) => !str_starts_with($p->value, 'tenant.')),
        ));
    }
}
