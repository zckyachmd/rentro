<?php

namespace Database\Seeders;

use App\Enum\PermissionName;
use App\Enum\RoleName;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // 1) Ensure permissions exist (idempotent)
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $enumPermissions = array_map(fn ($p) => $p->value, PermissionName::cases());

        foreach ($enumPermissions as $permName) {
            Permission::firstOrCreate([
                'name'       => $permName,
                'guard_name' => 'web',
            ]);
        }

        // 1b) Cleanup: remove permissions not defined in enum
        $existing = Permission::query()
            ->where('guard_name', 'web')
            ->pluck('name', 'id');
        $toDelete = $existing->filter(fn ($name) => !in_array($name, $enumPermissions, true))->keys()->all();
        if (!empty($toDelete)) {
            Permission::query()->whereIn('id', $toDelete)->delete();
        }

        // 2) Ensure roles exist (idempotent)
        foreach (RoleName::cases() as $role) {
            Role::firstOrCreate([
                'name'       => $role->value,
                'guard_name' => 'web',
            ]);
        }

        // 3) Default permissions: only Super Admin gets all
        $super = Role::where('name', RoleName::SUPER_ADMIN->value)
            ->where('guard_name', 'web')
            ->first();
        if ($super) {
            $super->givePermissionTo($enumPermissions);
        }

        // 4) Assign baseline permissions to other roles
        // Tenant: granular default permissions for portal
        $tenant = Role::where('name', RoleName::TENANT->value)
            ->where('guard_name', 'web')
            ->first();
        if ($tenant) {
            $tenantPerms = [
                PermissionName::TENANT_ROOMS_VIEW->value,
                PermissionName::TENANT_BOOKING_VIEW->value,
                PermissionName::TENANT_BOOKING_CREATE->value,
                PermissionName::TENANT_CONTRACT_VIEW->value,
                PermissionName::TENANT_CONTRACT_STOP_RENEW->value,
                PermissionName::TENANT_HANDOVER_VIEW->value,
                PermissionName::TENANT_HANDOVER_ACK->value,
                PermissionName::TENANT_HANDOVER_DISPUTE->value,
                PermissionName::TENANT_INVOICE_VIEW->value,
                PermissionName::TENANT_INVOICE_PAY->value,
                PermissionName::TENANT_PAYMENT_VIEW->value,
            ];
            $tenant->givePermissionTo($tenantPerms);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
