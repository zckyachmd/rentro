<?php

namespace Database\Seeders;

use App\Models\Amenity;
use App\Models\Building;
use App\Models\Floor;
use App\Models\Room;
use App\Models\RoomPhoto;
use App\Models\RoomType;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class RoomSeeder extends Seeder
{
    public function run(): void
    {
        // 1) Buat 1 building
        $building = Building::factory()->create();

        // 2) Buat 2 lantai (level 1 & 2) untuk building tsb.
        $floors = Floor::factory()
            ->count(3)
            ->forBuilding($building)
            ->sequence(
                ['level' => 1, 'name' => 'Lantai 1'],
                ['level' => 2, 'name' => 'Lantai 2'],
                ['level' => 3, 'name' => 'Lantai 2'],
            )
            ->create();

        // 3) Buat tipe kamar (2–3 buah) via factory
        $types = RoomType::factory()->count(2)->create();

        // 4) Buat pool amenities minimal 8 via factory (agar bisa di-attach)
        if (Amenity::count() < 8) {
            Amenity::factory()->count(8)->create();
        }
        $amenityPool = Amenity::all();

        // 5) Generate kamar per lantai, gaya chaining seperti User::factory()->has(...)->create()
        foreach ($floors as $floor) {
            $numbers = collect(range(1, 30))
                ->shuffle()
                ->take(5)
                ->map(fn(int $i) => sprintf('%d%02d', $floor->level, $i))
                ->values();

            Room::factory()
                ->count(5)
                ->for($floor, 'floor')
                ->for($building, 'building')
                ->state(function () use ($types) {
                    return [
                        'room_type_id' => Arr::random($types->pluck('id')->all()),
                    ];
                })
                ->state(new Sequence(
                    ...$numbers->map(fn($n) => ['number' => $n])->all()
                ))
                ->has(RoomPhoto::factory()->cover(), 'photos')
                ->has(RoomPhoto::factory()->count(2), 'photos')
                ->hasAttached(
                    $amenityPool->shuffle()->take(fake()->numberBetween(3, 7)),
                    [],
                    'amenities'
                )
                ->create();
        }
    }
}
