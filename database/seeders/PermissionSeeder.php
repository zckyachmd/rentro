<?php

namespace Database\Seeders;

use App\Enum\PermissionName;
use App\Enum\RoleName;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionName::cases() as $p) {
            Permission::firstOrCreate(['name' => $p->value, 'guard_name' => 'web']);
        }

        $role = Role::firstOrCreate(['name' => RoleName::SUPER_ADMIN->value, 'guard_name' => 'web']);
        $all = Permission::all()->pluck('name')->all();
        $role->syncPermissions($all);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
