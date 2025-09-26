<?php

namespace Database\Seeders;

use App\Models\Amenity;
use Illuminate\Database\Seeder;

class AmenitySeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'names' => ['id' => 'AC', 'en' => 'Air Conditioner'],
                'icon'  => 'AirVent',
                'category' => 'room',
            ],
            [
                'names' => ['id' => 'Wi‑Fi', 'en' => 'Wi‑Fi'],
                'icon'  => 'Wifi',
                'category' => 'room',
            ],
            [
                'names' => ['id' => 'Kamar Mandi Dalam', 'en' => 'Ensuite Bathroom'],
                'icon'  => 'ShowerHead',
                'category' => 'room',
            ],
            [
                'names' => ['id' => 'Lemari', 'en' => 'Wardrobe'],
                'icon'  => 'Archive',
                'category' => 'room',
            ],
            [
                'names' => ['id' => 'Meja', 'en' => 'Desk'],
                'icon'  => 'LayoutGrid',
                'category' => 'room',
            ],
            [
                'names' => ['id' => 'Air Panas', 'en' => 'Hot Water'],
                'icon'  => 'Thermometer',
                'category' => 'communal',
            ],
            [
                'names' => ['id' => 'Parkir Motor', 'en' => 'Motorbike Parking'],
                'icon'  => 'Bike',
                'category' => 'communal',
            ],
            [
                'names' => ['id' => 'Parkir Mobil', 'en' => 'Car Parking'],
                'icon'  => 'Car',
                'category' => 'communal',
            ],
            [
                'names' => ['id' => 'Jendela', 'en' => 'Window'],
                'icon'  => 'PanelTop',
                'category' => 'room',
            ],
        ];

        foreach ($items as $it) {
            // Use Indonesian as canonical unique key for name (fallback)
            $fallback = $it['names']['id'] ?? reset($it['names']);
            /** @var Amenity $amenity */
            $amenity = Amenity::query()->firstOrNew(['name' => $fallback]);
            $amenity->icon = $it['icon'];
            $amenity->category = $it['category'];
            $amenity->name_i18n = $it['names']; // mutator syncs fallback name
            $amenity->save();
        }
    }
}

