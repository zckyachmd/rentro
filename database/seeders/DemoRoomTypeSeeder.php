<?php

namespace Database\Seeders;

use App\Models\RoomType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoRoomTypeSeeder extends Seeder
{
    public function run(): void
    {
        $presets = [
            [
                'name'     => 'Standard',
                'capacity' => 1,
                'prices'   => ['daily' => 50000, 'weekly' => 300000, 'monthly' => 1000000],
                'deposits' => ['daily' => 50000, 'weekly' => 150000, 'monthly' => 500000],
            ],
            [
                'name'     => 'Deluxe',
                'capacity' => 2,
                'prices'   => ['daily' => 75000, 'weekly' => 450000, 'monthly' => 1500000],
                'deposits' => ['daily' => 70000, 'weekly' => 200000, 'monthly' => 700000],
            ],
            [
                'name'     => 'Suite',
                'capacity' => 2,
                'prices'   => ['daily' => 100000, 'weekly' => 650000, 'monthly' => 2000000],
                'deposits' => ['daily' => 100000, 'weekly' => 300000, 'monthly' => 1000000],
            ],
        ];

        foreach ($presets as $p) {
            $slug = Str::slug((string) $p['name']);
            $exists = RoomType::where('name', $p['name'])->exists();
            if ($exists) {
                RoomType::where('name', $p['name'])->update([
                    'capacity'   => $p['capacity'],
                    'prices'     => $p['prices'],
                    'deposits'   => $p['deposits'],
                    'is_active'  => true,
                ]);
                continue;
            }

            RoomType::create([
                'name'      => $p['name'],
                'slug'      => $slug,
                'capacity'  => $p['capacity'],
                'prices'    => $p['prices'],
                'deposits'  => $p['deposits'],
                'is_active' => true,
            ]);
        }
    }
}
