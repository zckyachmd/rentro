<?php

namespace Database\Seeders;

use App\Models\RoomType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RoomTypeSeeder extends Seeder
{
    public function run(): void
    {
        $presets = [
            [
                'name'     => 'Standard',
                'capacity' => 1,
                'prices'   => ['daily' => 50_000 * 100, 'weekly' => 300_000 * 100, 'monthly' => 1_000_000 * 100],
                'deposits' => ['daily' => 50_000 * 100, 'weekly' => 150_000 * 100, 'monthly' => 500_000 * 100],
            ],
            [
                'name'     => 'Deluxe',
                'capacity' => 2,
                'prices'   => ['daily' => 75_000 * 100, 'weekly' => 450_000 * 100, 'monthly' => 1_500_000 * 100],
                'deposits' => ['daily' => 70_000 * 100, 'weekly' => 200_000 * 100, 'monthly' => 700_000 * 100],
            ],
            [
                'name'     => 'Suite',
                'capacity' => 2,
                'prices'   => ['daily' => 100_000 * 100, 'weekly' => 650_000 * 100, 'monthly' => 2_000_000 * 100],
                'deposits' => ['daily' => 100_000 * 100, 'weekly' => 300_000 * 100, 'monthly' => 1_000_000 * 100],
            ],
        ];

        foreach ($presets as $p) {
            $exists = RoomType::where('name', $p['name'])->exists();
            if ($exists) {
                // Optionally update existing to keep consistent
                RoomType::where('name', $p['name'])->update([
                    'capacity' => $p['capacity'],
                    'prices'   => $p['prices'],
                    'deposits' => $p['deposits'],
                    'is_active'=> true,
                ]);
                continue;
            }

            RoomType::create([
                'name'      => $p['name'],
                'slug'      => Str::slug($p['name']) . '-' . Str::random(4),
                'capacity'  => $p['capacity'],
                'prices'    => $p['prices'],
                'deposits'  => $p['deposits'],
                'is_active' => true,
            ]);
        }
    }
}

