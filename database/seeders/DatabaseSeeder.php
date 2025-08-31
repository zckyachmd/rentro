<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AppSettingSeeder::class,
            PermissionSeeder::class,
            MenuSeeder::class,
            UserSeeder::class,
            RoomSeeder::class,
            ContractSeeder::class,
        ]);
    }
}
