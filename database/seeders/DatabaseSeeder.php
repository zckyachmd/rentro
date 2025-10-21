<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AppSettingSeeder::class,
            RoleSeeder::class,
            MenuSeeder::class,
            PublicMenuSeeder::class,
            AdminUserSeeder::class,
        ]);
    }
}
