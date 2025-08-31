<?php

namespace Database\Factories;

use App\Models\Amenity;
use Illuminate\Database\Eloquent\Factories\Factory;

class AmenityFactory extends Factory
{
    protected $model = Amenity::class;

    public function definition(): array
    {
        static $pool = [
            ['AC', 'ac'],
            ['Wi-Fi', 'wifi'],
            ['Kamar Mandi Dalam', 'shower-head'],
            ['Lemari', 'wardrobe'],
            ['Meja', 'table-2'],
            ['Air Panas', 'thermometer'],
            ['Parkir Motor', 'bike'],
            ['Parkir Mobil', 'car'],
            ['Jendela', 'panel-top'],
        ];
        $pick = $this->faker->unique()->randomElement($pool);

        return [
            'name'     => $pick[0],
            'icon'     => $pick[1],        // simpan nama icon (lucide/mdi)
            'category' => 'kamar',         // bisa "komunal" kalau dibutuhkan
        ];
    }
}
