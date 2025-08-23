<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\UserAddress;
use App\Models\UserDocument;
use App\Models\EmergencyContact;
use App\Enum\RoleName;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::factory([
            'name'     => 'Admin',
            'username' => 'admin',
            'email'    => 'admin@mail.com',
            'gender'   => 'male',
            'password' => 'Admin1234!',
        ])
            ->has(UserAddress::factory()->count(1), 'addresses')
            ->has(UserDocument::factory()->count(1), 'document')
            ->has(EmergencyContact::factory()->count(2), 'emergencyContacts')
            ->create();

        $admin->assignRole(RoleName::SUPER_ADMIN->value);
    }
}
