<?php

namespace Database\Factories;

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use App\Models\Contract;
use App\Models\Room;
use App\Models\User;
use Godruoyi\Snowflake\Snowflake;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContractFactory extends Factory
{
    protected $model = Contract::class;

    public function definition(): array
    {
        $sf = new Snowflake((int) config('snowflake.datacenter_id', 1), (int) config('snowflake.worker_id', 1));
        $epoch = (int) config('snowflake.epoch_ms', 1704067200000);
        if ($epoch > 0) { $sf->setStartTimeStamp($epoch); }

        $start = $this->faker->dateTimeBetween('-2 months', '+1 day');
        $rent  = $this->faker->randomElement([900_000, 1_200_000, 1_500_000, 2_000_000]) * 100;

        $seq4 = str_pad((string) $this->faker->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT);
        $number = $seq4;

        return [
            'id'             => $sf->id(),
            'number'         => $number,
            'user_id'        => User::factory(),
            'room_id'        => Room::factory(),
            'start_date'     => $start->format('Y-m-d'),
            'end_date'       => (clone $start)->modify('+1 month')->format('Y-m-d'),
            'rent_cents'     => $rent,
            'deposit_cents'  => (int) round($rent * 0.5),
            'billing_period' => BillingPeriod::MONTHLY->value,
            'billing_day'    => (int) $this->faker->numberBetween(1, 28),
            'status'         => ContractStatus::ACTIVE->value,
            'auto_renew'     => true,
            'renewal_cancelled_at' => null,
            'deposit_refund_cents' => null,
            'deposit_refunded_at'  => null,
            'notes'          => $this->faker->boolean(20) ? $this->faker->sentence(6) : null,
        ];
    }
}
