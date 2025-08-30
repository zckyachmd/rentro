<?php

namespace Database\Factories;

use App\Models\RoomType;
use Godruoyi\Snowflake\Snowflake;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RoomTypeFactory extends Factory
{
    protected $model = RoomType::class;

    public function definition(): array
    {
        $name = $this->faker->randomElement(['Standard', 'Deluxe', 'Suite', 'Economy']);
        $sf = new Snowflake((int) config('snowflake.datacenter_id', 1), (int) config('snowflake.worker_id', 1));
        $epoch = (int) config('snowflake.epoch_ms', 1704067200000);
        if ($epoch > 0) { $sf->setStartTimeStamp($epoch); }

        return [
            'id'              => $sf->id(),
            'name'            => $name,
            'slug'            => Str::slug($name) . '-' . Str::random(4),
            'capacity'        => $this->faker->randomElement([1, 1, 2]),
            'size_m2'         => $this->faker->randomFloat(2, 8, 20),
            'price_cents'     => $this->faker->randomElement([900_000, 1_200_000, 1_500_000, 2_000_000]) * 100,
            'deposit_cents'   => $this->faker->randomElement([0, 500_000, 1_000_000]) * 100,
            'description'     => $this->faker->sentence(8),
            'is_active'       => true,
        ];
    }
}
