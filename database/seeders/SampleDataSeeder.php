<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SampleDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            WifiSetupSeeder::class,
            AmenitySeeder::class,
            RoomTypeSeeder::class,
            RoomSeeder::class,
            PromotionSeeder::class,
            PromotionCouponSeeder::class,
            TestimonySeeder::class,
        ]);
    }
}
