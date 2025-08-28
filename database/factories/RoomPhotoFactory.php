<?php

namespace Database\Factories;

use App\Models\Room;
use App\Models\RoomPhoto;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoomPhotoFactory extends Factory
{
    protected $model = RoomPhoto::class;

    public function definition(): array
    {
        return [
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
