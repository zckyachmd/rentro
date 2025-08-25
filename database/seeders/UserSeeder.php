<?php

namespace Database\Seeders;

use App\Enum\Gender;
use App\Models\User;
use App\Enum\RoleName;
use App\Models\UserAddress;
use App\Models\UserDocument;
use Illuminate\Database\Seeder;
use App\Models\EmergencyContact;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

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
            'gender'   => Gender::MALE->value,
            'password' => 'Admin1234!',
        ])
            ->has(UserAddress::factory()->count(1), 'addresses')
            ->has(UserDocument::factory()->count(1), 'document')
            ->has(EmergencyContact::factory()->count(2), 'emergencyContacts')
            ->create();

        $admin->assignRole(RoleName::SUPER_ADMIN->value);

        User::factory()->count(25)->create()->each->assignRole(RoleName::TENANT->value);
    }
}
