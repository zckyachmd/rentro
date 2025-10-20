<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DemoAmenitySeeder extends Seeder
{
    public function run(): void
    {
        (new AmenitySeeder())->run();
    }
}

