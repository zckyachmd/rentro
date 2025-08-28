<?php

namespace Database\Factories;

use App\Enum\RoomStatus;
use App\Models\RoomType;
use App\Enum\GenderPolicy;
use App\Enum\BillingPeriod;
use Illuminate\Support\Arr;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoomFactory extends Factory
{
    public function definition(): array
    {
        $priceIdr = $this->faker->randomElement([900_000, 1_200_000, 1_500_000, 2_000_000]);

        return [
            'building_id'    => null,
            'floor_id'       => null,
            'room_type_id'   => RoomType::factory(),
            'number'         => $this->faker->numerify('###'),
            'name'           => null,
            'size_m2'        => $this->faker->randomFloat(2, 8, 20),
            'price_cents'    => $priceIdr * 100,
            'price_currency' => 'IDR',
            'deposit_cents'  => $this->faker->randomElement([0, 500_00000, 1_000_00000]),
            'billing_period' => BillingPeriod::MONTHLY->value,
            'max_occupancy'  => $this->faker->randomElement([1, 1, 2]),
            'is_shared'      => $this->faker->boolean(10),
            'status'         => Arr::random([RoomStatus::VACANT->value, RoomStatus::OCCUPIED->value, RoomStatus::MAINTENANCE->value]),
            'gender_policy'  => Arr::random([GenderPolicy::ANY->value, GenderPolicy::MALE->value, GenderPolicy::FEMALE->value]),
            'notes'          => $this->faker->boolean(30) ? $this->faker->sentence(6) : null,
        ];
    }
}
