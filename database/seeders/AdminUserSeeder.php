<?php

namespace Database\Seeders;

use App\Enum\Gender;
use App\Enum\RoleName;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->firstOrCreate(
            ['email' => 'admin@mail.com'],
            [
                'name'     => 'Admin',
                'username' => 'admin',
                'gender'   => Gender::MALE->value,
                'password' => 'Admin1234!', // cast: hashed
                'email_verified_at' => now(),
            ]
        );

        if (! $user->hasRole(RoleName::SUPER_ADMIN->value)) {
            $user->assignRole(RoleName::SUPER_ADMIN->value);
        }
    }
}
