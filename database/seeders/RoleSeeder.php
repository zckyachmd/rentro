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

        foreach (PermissionName::cases() as $perm) {
            Permission::firstOrCreate([
                'name'       => $perm->value,
                'guard_name' => 'web',
            ]);
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
            $all = Permission::query()->pluck('name')->all();
            $super->givePermissionTo($all);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
