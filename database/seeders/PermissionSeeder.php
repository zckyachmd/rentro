<?php

namespace Database\Seeders;

use App\Enum\PermissionName;
use App\Enum\RoleName;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (PermissionName::cases() as $p) {
            Permission::firstOrCreate(['name' => $p->value, 'guard_name' => 'web']);
        }

        $allPermissions = Permission::all()->pluck('name')->all();

        $rolesWithPermissions = [
            RoleName::SUPER_ADMIN->value => $allPermissions,
            RoleName::OWNER->value => [
                PermissionName::USER_VIEW,
                PermissionName::USER_CREATE,
                PermissionName::USER_ROLE_MANAGE,
                PermissionName::USER_PASSWORD_RESET,
                PermissionName::USER_TWO_FACTOR,
                PermissionName::USER_FORCE_LOGOUT,
                // Rooms
                PermissionName::ROOM_MANAGE_VIEW,
                PermissionName::ROOM_MANAGE_CREATE,
                PermissionName::ROOM_MANAGE_UPDATE,
                PermissionName::ROOM_MANAGE_DELETE,
                // Room Photos
                PermissionName::ROOM_PHOTO_VIEW,
                PermissionName::ROOM_PHOTO_CREATE,
                PermissionName::ROOM_PHOTO_DELETE,
                // Buildings
                PermissionName::BUILDING_VIEW,
                PermissionName::BUILDING_CREATE,
                PermissionName::BUILDING_UPDATE,
                PermissionName::BUILDING_DELETE,
                // Floors
                PermissionName::FLOOR_VIEW,
                PermissionName::FLOOR_CREATE,
                PermissionName::FLOOR_UPDATE,
                PermissionName::FLOOR_DELETE,
                // Room Types
                PermissionName::ROOM_TYPE_VIEW,
                PermissionName::ROOM_TYPE_CREATE,
                PermissionName::ROOM_TYPE_UPDATE,
                PermissionName::ROOM_TYPE_DELETE,
                // Amenities
                PermissionName::AMENITY_VIEW,
                PermissionName::AMENITY_CREATE,
                PermissionName::AMENITY_UPDATE,
                PermissionName::AMENITY_DELETE,
                // Contracts
                PermissionName::CONTRACT_VIEW,
                PermissionName::CONTRACT_CREATE,
                PermissionName::CONTRACT_EXTEND,
                PermissionName::CONTRACT_CANCEL,
                PermissionName::CONTRACT_RENEW,
                // Invoices
                PermissionName::INVOICE_VIEW,
                PermissionName::INVOICE_CREATE,
                PermissionName::INVOICE_UPDATE,
                PermissionName::INVOICE_DELETE,
                // Payments
                PermissionName::PAYMENT_VIEW,
                PermissionName::PAYMENT_CREATE,
                PermissionName::PAYMENT_UPDATE,
                PermissionName::PAYMENT_DELETE,
                // Handover
                PermissionName::HANDOVER_VIEW,
                PermissionName::HANDOVER_CREATE,
                PermissionName::HANDOVER_UPDATE,
                PermissionName::HANDOVER_DELETE,
                // Audit Log
                PermissionName::AUDIT_LOG_VIEW,
            ],
            RoleName::MANAGER->value => [
                PermissionName::USER_VIEW,
                PermissionName::USER_CREATE,
                PermissionName::USER_PASSWORD_RESET,
                PermissionName::USER_TWO_FACTOR,
                PermissionName::USER_FORCE_LOGOUT,
                // Rooms
                PermissionName::ROOM_MANAGE_VIEW,
                PermissionName::ROOM_MANAGE_CREATE,
                PermissionName::ROOM_MANAGE_UPDATE,
                // Room Photos
                PermissionName::ROOM_PHOTO_VIEW,
                PermissionName::ROOM_PHOTO_CREATE,
                // Buildings
                PermissionName::BUILDING_VIEW,
                PermissionName::BUILDING_CREATE,
                PermissionName::BUILDING_UPDATE,
                // Floors
                PermissionName::FLOOR_VIEW,
                PermissionName::FLOOR_CREATE,
                PermissionName::FLOOR_UPDATE,
                // Room Types
                PermissionName::ROOM_TYPE_VIEW,
                PermissionName::ROOM_TYPE_CREATE,
                PermissionName::ROOM_TYPE_UPDATE,
                // Amenities
                PermissionName::AMENITY_VIEW,
                PermissionName::AMENITY_CREATE,
                PermissionName::AMENITY_UPDATE,
                // Contracts
                PermissionName::CONTRACT_VIEW,
                PermissionName::CONTRACT_CREATE,
                PermissionName::CONTRACT_EXTEND,
                PermissionName::CONTRACT_RENEW,
                // Invoices
                PermissionName::INVOICE_VIEW,
                PermissionName::INVOICE_CREATE,
                PermissionName::INVOICE_UPDATE,
                // Payments
                PermissionName::PAYMENT_VIEW,
                PermissionName::PAYMENT_CREATE,
                PermissionName::PAYMENT_UPDATE,
                // Handover
                PermissionName::HANDOVER_VIEW,
                PermissionName::HANDOVER_CREATE,
                PermissionName::HANDOVER_UPDATE,
            ],
        ];

        foreach ($rolesWithPermissions as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $normalized = array_map(function ($p) {
                return is_string($p)
                    ? $p
                    : (\is_object($p) && property_exists($p, 'value') ? $p->value : (string) $p);
            }, $permissions);
            $role->syncPermissions($normalized);
        }
    }
}
