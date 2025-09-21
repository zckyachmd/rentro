<?php

namespace Database\Seeders;

use App\Models\Amenity;
use App\Models\Building;
use App\Models\Floor;
use App\Models\Room;
use App\Models\RoomPhoto;
use App\Models\RoomType;
use Database\Seeders\RoomTypeSeeder;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class RoomSeeder extends Seeder
{
    public function run(): void
    {
        $building = Building::factory()->create();

        $floors = Floor::factory()
            ->count(3)
            ->forBuilding($building)
            ->sequence(
                ['level' => 1, 'name' => 'Lantai 1'],
                ['level' => 2, 'name' => 'Lantai 2'],
                ['level' => 3, 'name' => 'Lantai 3'],
            )
            ->create();

        // Ensure we have 3 standard types (Standard/Deluxe/Suite)
        if (RoomType::count() < 3) {
            (new RoomTypeSeeder())->run();
        }
        $types = RoomType::all(['id']);

        if (Amenity::count() < 8) {
            Amenity::factory()->count(8)->create();
        }
        $amenityPool = Amenity::all();

        foreach ($floors as $floor) {
            $numbers = collect(range(1, 100))
                ->shuffle()
                ->take(30)
                ->map(fn(int $i) => sprintf('%d%02d', $floor->level, $i))
                ->values();

            Room::factory()
                ->count(30)
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
