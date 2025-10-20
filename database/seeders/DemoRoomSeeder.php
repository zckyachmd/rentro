<?php

namespace Database\Seeders;

use App\Enum\RoomStatus;
use App\Models\Building;
use App\Models\Floor;
use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Database\Seeder;

class DemoRoomSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure base room types exist
        if (!RoomType::where('name', 'Standard')->exists() || !RoomType::where('name', 'Deluxe')->exists() || !RoomType::where('name', 'Suite')->exists()) {
            (new DemoRoomTypeSeeder())->run();
        }

        $standard = RoomType::where('name', 'Standard')->first();
        $deluxe   = RoomType::where('name', 'Deluxe')->first();
        $suite    = RoomType::where('name', 'Suite')->first();

        // Building A with 3 floors
        $building = Building::firstOrCreate(['code' => 'A'], ['name' => 'Gedung A']);
        $floor1   = Floor::firstOrCreate(['building_id' => $building->id, 'level' => 1], ['name' => 'Lantai 1']);
        $floor2   = Floor::firstOrCreate(['building_id' => $building->id, 'level' => 2], ['name' => 'Lantai 2']);
        $floor3   = Floor::firstOrCreate(['building_id' => $building->id, 'level' => 3], ['name' => 'Lantai 3']);

        // Sample rooms (no factory)
        $rooms = [
            ['number' => 'A-101', 'name' => 'Kamar A-101', 'floor' => $floor1, 'type' => $standard],
            ['number' => 'A-102', 'name' => 'Kamar A-102', 'floor' => $floor1, 'type' => $standard],
            ['number' => 'A-103', 'name' => 'Kamar A-103', 'floor' => $floor1, 'type' => $standard],
            ['number' => 'A-201', 'name' => 'Kamar A-201', 'floor' => $floor2, 'type' => $deluxe],
            ['number' => 'A-202', 'name' => 'Kamar A-202', 'floor' => $floor2, 'type' => $deluxe],
            ['number' => 'A-203', 'name' => 'Kamar A-203', 'floor' => $floor2, 'type' => $deluxe],
            ['number' => 'A-301', 'name' => 'Kamar A-301', 'floor' => $floor3, 'type' => $suite],
            ['number' => 'A-302', 'name' => 'Kamar A-302', 'floor' => $floor3, 'type' => $suite],
        ];

        foreach ($rooms as $r) {
            if (!$r['type']) {
                continue;
            }
            Room::firstOrCreate(
                ['number' => $r['number']],
                [
                    'name'         => $r['name'],
                    'building_id'  => $building->id,
                    'floor_id'     => $r['floor']->id,
                    'room_type_id' => $r['type']->id,
                    'status'       => RoomStatus::VACANT->value,
                ]
            );
        }
    }
}
