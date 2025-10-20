<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            DemoWifiSeeder::class,
            DemoAmenitySeeder::class,
            DemoRoomTypeSeeder::class,
            DemoRoomSeeder::class,
            DemoPromotionSeeder::class,
            DemoPromotionCouponSeeder::class,
            DemoTestimonySeeder::class,
            DemoBookingScenarioSeeder::class,
        ]);
    }
}
