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
                PermissionName::ROOM_VIEW,
                PermissionName::ROOM_CREATE,
                PermissionName::ROOM_UPDATE,
                PermissionName::ROOM_DELETE,
                PermissionName::AUDIT_LOG_VIEW,
            ],
            RoleName::MANAGER->value => [
                PermissionName::USER_VIEW,
                PermissionName::USER_CREATE,
                PermissionName::USER_PASSWORD_RESET,
                PermissionName::USER_TWO_FACTOR,
                PermissionName::USER_FORCE_LOGOUT,
                PermissionName::ROOM_VIEW,
                PermissionName::ROOM_CREATE,
                PermissionName::ROOM_UPDATE,
            ],
            RoleName::TENANT->value => [],
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
