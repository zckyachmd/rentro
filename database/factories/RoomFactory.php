<?php

namespace Database\Factories;

use App\Enum\RoomStatus;
use App\Models\RoomType;
use App\Enum\GenderPolicy;
use App\Enum\BillingPeriod;
use Godruoyi\Snowflake\Snowflake;
use Illuminate\Support\Arr;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoomFactory extends Factory
{
    public function definition(): array
    {
        $priceIdr = $this->faker->randomElement([900_000, 1_200_000, 1_500_000, 2_000_000]);
        $sf = new Snowflake((int) config('snowflake.datacenter_id', 1), (int) config('snowflake.worker_id', 1));
        $epoch = (int) config('snowflake.epoch_ms', 1704067200000);
        if ($epoch > 0) { $sf->setStartTimeStamp($epoch); }

        return [
            'id'              => $sf->id(),
            'building_id'    => null,
            'floor_id'       => null,
            'room_type_id'   => RoomType::factory(),
            'number'         => $this->faker->numerify('###'),
            'name'           => null,
            'size_m2'        => $this->faker->boolean(30) ? null : $this->faker->randomFloat(2, 8, 20),
            'price_cents'    => $this->faker->boolean(40) ? null : $priceIdr * 100,
            'billing_period' => BillingPeriod::MONTHLY->value,
            'max_occupancy'  => $this->faker->randomElement([1, 1, 2]),
            'status'         => Arr::random([RoomStatus::VACANT->value, RoomStatus::OCCUPIED->value, RoomStatus::MAINTENANCE->value]),
            'gender_policy'  => Arr::random([GenderPolicy::ANY->value, GenderPolicy::MALE->value, GenderPolicy::FEMALE->value]),
            'notes'          => $this->faker->boolean(30) ? $this->faker->sentence(6) : null,
        ];
    }
}
