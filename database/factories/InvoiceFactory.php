<?php

namespace Database\Factories;

use App\Enum\InvoiceStatus;
use App\Models\Contract;
use App\Models\Invoice;
use Godruoyi\Snowflake\Snowflake;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $sf = new Snowflake((int) config('snowflake.datacenter_id', 1), (int) config('snowflake.worker_id', 1));
        $epoch = (int) config('snowflake.epoch_ms', 1704067200000);
        if ($epoch > 0) { $sf->setStartTimeStamp($epoch); }

        $start = $this->faker->dateTimeBetween('-1 month', '+1 week');
        $end   = (clone $start)->modify('+1 month');
        $due   = (clone $start)->modify('+3 days');

        return [
            'id'           => $sf->id(),
            'contract_id'  => Contract::factory(),
            'number'       => $this->generateNumber(),
            'period_start' => $start->format('Y-m-d'),
            'period_end'   => $end->format('Y-m-d'),
            'due_date'     => $due->format('Y-m-d'),
            'amount_idr' => $this->faker->randomElement([900_000, 1_200_000, 1_500_000, 2_000_000]),
            'status'       => InvoiceStatus::PENDING->value,
            'paid_at'      => null,
        ];
    }

    protected function generateNumber(): string
    {
        static $used = [];

        do {
            $candidate = 'INV-' . now()->format('Ym') . '-' . Str::upper(Str::random(6));
        } while (isset($used[$candidate]) || \App\Models\Invoice::where('number', $candidate)->exists());

        $used[$candidate] = true;
        return $candidate;
    }
}
