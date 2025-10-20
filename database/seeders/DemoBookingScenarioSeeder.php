<?php

namespace Database\Seeders;

use App\Enum\RoomStatus;
use App\Models\Building;
use App\Models\Floor;
use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Database\Seeder;

class DemoBookingScenarioSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure Standard type exists deterministically
        $type = RoomType::where('name', 'Standard')->first();
        if (!$type) {
            (new DemoRoomTypeSeeder())->run();
            $type = RoomType::where('name', 'Standard')->first();
        }
        if (!$type) return;

        $building = Building::firstOrCreate(['code' => 'A'], ['name' => 'Gedung A', 'address' => null]);
        $floor    = Floor::firstOrCreate(['building_id' => $building->id, 'level' => 1], ['name' => 'Lantai 1']);

        Room::firstOrCreate(
            ['number' => 'A-101'],
            [
                'name'         => 'Kamar A-101',
                'building_id'  => $building->id,
                'floor_id'     => $floor->id,
                'room_type_id' => $type->id,
                'status'       => RoomStatus::VACANT->value,
            ]
        );
    }
}
