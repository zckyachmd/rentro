<?php

namespace Database\Factories;

use App\Models\Room;
use App\Models\RoomPhoto;
use Illuminate\Database\Eloquent\Factories\Factory;
use Godruoyi\Snowflake\Snowflake;

class RoomPhotoFactory extends Factory
{
    protected $model = RoomPhoto::class;

    public function definition(): array
    {
        $sf = new Snowflake((int) config('snowflake.datacenter_id', 1), (int) config('snowflake.worker_id', 1));
        $epoch = (int) config('snowflake.epoch_ms', 1704067200000);
        if ($epoch > 0) { $sf->setStartTimeStamp($epoch); }

        return [
            'id'       => $sf->id(),
            'room_id'  => Room::factory(),
            'path'     => 'rooms/' . $this->faker->uuid() . '.jpg',
            'is_cover' => false,
            'ordering' => 0,
        ];
    }

    public function cover(): self
    {
        return $this->state(fn() => ['is_cover' => true, 'ordering' => 0]);
    }
}
