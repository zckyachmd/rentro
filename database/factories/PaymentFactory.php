<?php

namespace Database\Factories;

use App\Enum\PaymentMethod;
use App\Enum\PaymentStatus;
use App\Models\Invoice;
use App\Models\Payment;
use Godruoyi\Snowflake\Snowflake;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        $sf = new Snowflake((int) config('snowflake.datacenter_id', 1), (int) config('snowflake.worker_id', 1));
        $epoch = (int) config('snowflake.epoch_ms', 1704067200000);
        if ($epoch > 0) { $sf->setStartTimeStamp($epoch); }

        $method = $this->faker->randomElement([PaymentMethod::CASH->value, PaymentMethod::VIRTUAL_ACCOUNT->value]);
        $status = $method === PaymentMethod::CASH->value
            ? PaymentStatus::COMPLETED->value
            : $this->faker->randomElement([PaymentStatus::PENDING->value, PaymentStatus::COMPLETED->value]);

        $paidAt = $status === PaymentStatus::COMPLETED->value ? now() : null;

        $vaNumber = $method === PaymentMethod::VIRTUAL_ACCOUNT->value ? ('8808' . $this->faker->numerify('##########')) : null;
        $vaExp    = $method === PaymentMethod::VIRTUAL_ACCOUNT->value ? now()->addDays(3) : null;

        return [
            'id'           => $sf->id(),
            'invoice_id'   => Invoice::factory(),
            'method'       => $method,
            'status'       => $status,
            'amount_cents' => $this->faker->randomElement([900_000, 1_200_000, 1_500_000, 2_000_000]) * 100,
            'paid_at'      => $paidAt,
            'reference'    => Str::upper(Str::random(10)),
            'provider'     => $method === PaymentMethod::VIRTUAL_ACCOUNT->value ? $this->faker->randomElement(['BCA', 'BNI', 'BRI']) : 'CASHIER',
            'va_number'    => $vaNumber,
            'va_expired_at'=> $vaExp,
            'meta'         => null,
        ];
    }
}

