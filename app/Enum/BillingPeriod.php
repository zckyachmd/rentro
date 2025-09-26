<?php

namespace App\Enum;

enum BillingPeriod: string
{
    case DAILY   = 'daily';
    case WEEKLY  = 'weekly';
    case MONTHLY = 'monthly';

    public function label(): string
    {
        return __('enum.billing_period.' . strtolower($this->name));
    }

    public static function options(): array
    {
        $units = self::units();

        return collect(self::cases())
            ->map(fn (self $p) => [
                'value' => $p->value,
                'label' => $p->label(),
                'days'  => $units[$p->value] ?? null,
            ])
            ->all();
    }

    public static function units(): array
    {
        return [
            self::DAILY->value   => 1,
            self::WEEKLY->value  => 7,
            self::MONTHLY->value => 30,
        ];
    }
}
