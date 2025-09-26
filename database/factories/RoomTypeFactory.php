<?php

namespace Database\Factories;

use App\Models\RoomType;
use Godruoyi\Snowflake\Snowflake;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RoomTypeFactory extends Factory
{
    protected $model = RoomType::class;
    protected static int $seq = 0;

    public function definition(): array
    {
        // Rotate through 3 distinct presets to ensure variety and uniqueness
        $presets = [
            [
                'name'    => 'Standard',
                'prices'  => ['daily' => 50_000, 'weekly' => 300_000, 'monthly' => 1_000_000],
                'deposits'=> ['daily' => 50_000, 'weekly' => 150_000, 'monthly' => 500_000],
            ],
            [
                'name'    => 'Deluxe',
                'prices'  => ['daily' => 75_000, 'weekly' => 450_000, 'monthly' => 1_500_000],
                'deposits'=> ['daily' => 70_000, 'weekly' => 200_000, 'monthly' => 700_000],
            ],
            [
                'name'    => 'Suite',
                'prices'  => ['daily' => 100_000, 'weekly' => 650_000, 'monthly' => 2_000_000],
                'deposits'=> ['daily' => 100_000, 'weekly' => 300_000, 'monthly' => 1_000_000],
            ],
        ];
        $idx    = self::$seq % 3;
        self::$seq++;
        $preset = $presets[$idx];
        $name   = $preset['name'];
        $priceDailyIdr   = (int) $preset['prices']['daily'];
        $priceWeeklyIdr  = (int) $preset['prices']['weekly'];
        $priceMonthlyIdr = (int) $preset['prices']['monthly'];
        $depositDailyIdr   = (int) $preset['deposits']['daily'];
        $depositWeeklyIdr  = (int) $preset['deposits']['weekly'];
        $depositMonthlyIdr = (int) $preset['deposits']['monthly'];
        $sf = new Snowflake((int) config('snowflake.datacenter_id', 1), (int) config('snowflake.worker_id', 1));
        $epoch = (int) config('snowflake.epoch_ms', 1704067200000);
        if ($epoch > 0) {
            $sf->setStartTimeStamp($epoch);
        }

        return [
            'id'              => $sf->id(),
            'name'            => $name,
            'slug'            => Str::slug($name) . '-' . Str::random(4),
            'capacity'        => [1, 2, 2][$idx],
            'prices'          => [
                'daily'   => (int) $priceDailyIdr,
                'weekly'  => (int) $priceWeeklyIdr,
                'monthly' => (int) $priceMonthlyIdr,
            ],
            'deposits'        => [
                'daily'   => (int) $depositDailyIdr,
                'weekly'  => (int) $depositWeeklyIdr,
                'monthly' => (int) $depositMonthlyIdr,
            ],
            'description'     => $this->faker->sentence(8),
            'is_active'       => true,
        ];
    }
}
