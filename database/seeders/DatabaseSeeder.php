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
            PublicMenuSeeder::class,
            UserSeeder::class,
            AmenitySeeder::class,
            RoomTypeSeeder::class,
            RoomSeeder::class,
            PromotionSeeder::class,
            PromotionCouponSeeder::class,
        ]);
    }
}
