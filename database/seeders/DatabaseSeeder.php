<?php

namespace Database\Seeders;

use App\Models\EmergencyContact;
use App\Models\User;
use App\Models\UserAddress;
use App\Models\UserDocument;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory([
            'name'     => 'Admin',
            'username' => 'admin',
            'email'    => 'admin@mail.com',
            'gender'   => 'male',
            'password' => 'Admin1234!',
        ])
            ->has(UserAddress::factory()->count(1), 'addresses')
            ->has(UserDocument::factory()->count(1), 'documents')
            ->has(EmergencyContact::factory()->count(3), 'emergencyContacts')
            ->create();
    }
}
