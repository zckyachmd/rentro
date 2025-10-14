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
            [
                'id' => 'AC',
                'en' => 'Air Conditioner',
                'icon' => 'AirVent',
            ],
            [
                'id' => 'Wi‑Fi',
                'en' => 'Wi‑Fi',
                'icon' => 'Wifi',
            ],
            [
                'id' => 'Kamar Mandi Dalam',
                'en' => 'Ensuite Bathroom',
                'icon' => 'ShowerHead',
            ],
            [
                'id' => 'Lemari',
                'en' => 'Wardrobe',
                'icon' => 'Archive',
            ],
            [
                'id' => 'Meja',
                'en' => 'Desk',
                'icon' => 'LayoutGrid',
            ],
            [
                'id' => 'Air Panas',
                'en' => 'Hot Water',
                'icon' => 'Thermometer',
            ],
            [
                'id' => 'Parkir Motor',
                'en' => 'Motorbike Parking',
                'icon' => 'Bike',
            ],
            [
                'id' => 'Parkir Mobil',
                'en' => 'Car Parking',
                'icon' => 'Car',
            ],
            [
                'id' => 'Jendela',
                'en' => 'Window',
                'icon' => 'PanelTop',
            ],
        ];
        $pick = fake()->unique()->randomElement($pool);

        $cat = fake()->randomElement(['room', 'communal']);

        $names = [
            'id' => $pick['id'],
            'en' => $pick['en'],
        ];

        return [
            'name'       => $pick['en'],
            'name_i18n'  => $names,
            'icon'       => $pick['icon'],
            'category'   => $cat,
        ];
    }
}
