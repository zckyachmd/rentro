<?php

namespace Database\Factories;

use App\Enum\RoomStatus;
use App\Models\RoomType;
use App\Models\Floor;
use App\Enum\GenderPolicy;
use Godruoyi\Snowflake\Snowflake;
use Illuminate\Support\Arr;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoomFactory extends Factory
{
    public function definition(): array
    {
        $sf = new Snowflake((int) config('snowflake.datacenter_id', 1), (int) config('snowflake.worker_id', 1));
        $epoch = (int) config('snowflake.epoch_ms', 1704067200000);
        if ($epoch > 0) {
            $sf->setStartTimeStamp($epoch);
        }

        return [
            'id'              => $sf->id(),
            'floor_id'       => Floor::factory(),
            'building_id'    => function (array $attrs) {
                $floor = Floor::find($attrs['floor_id']);
                return $floor ? $floor->building_id : null;
            },
            'room_type_id'   => RoomType::factory(),
            'number'         => $this->faker->numerify('###'),
            'name'           => $this->faker->boolean(70) ? $this->faker->words(2, true) : null,
            'size_m2'        => $this->faker->boolean(30) ? null : $this->faker->randomFloat(2, 8, 20),
            'price_overrides'    => function (array $attrs) {
                $type = RoomType::find($attrs['room_type_id']);
                $prices = is_array($type?->prices) ? $type->prices : [];
                // 30% chance to override monthly with +50_000 to +200_000
                if (!empty($prices) && $this->faker->boolean(30)) {
                    $delta = $this->faker->numberBetween(50_000, 200_000) * 100;
                    $base  = (int) ($prices['monthly'] ?? 0);
                    return ['monthly' => max(0, $base + $delta)];
                }
                return null;
            },
            'deposit_overrides'  => function (array $attrs) {
                $type = RoomType::find($attrs['room_type_id']);
                $deps = is_array($type?->deposits) ? $type->deposits : [];
                if (!empty($deps) && $this->faker->boolean(20)) {
                    $delta = $this->faker->numberBetween(-100_000, 100_000) * 100;
                    $base  = (int) ($deps['monthly'] ?? 0);
                    $val   = max(0, $base + $delta);
                    if ($val !== $base) return ['monthly' => $val];
                }
                return null;
            },
            'max_occupancy'  => function (array $attrs) {
                $type = RoomType::find($attrs['room_type_id']);
                return $type ? (int) $type->capacity : 1;
            },
            'status'         => Arr::random([RoomStatus::VACANT->value, RoomStatus::MAINTENANCE->value, RoomStatus::INACTIVE->value]),
            'gender_policy'  => Arr::random([GenderPolicy::ANY->value, GenderPolicy::MALE->value, GenderPolicy::FEMALE->value]),
            'notes'          => $this->faker->boolean(30) ? $this->faker->sentence(6) : null,
        ];
    }
}
