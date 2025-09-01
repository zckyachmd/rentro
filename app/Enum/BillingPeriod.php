<?php

namespace App\Enum;

enum BillingPeriod: string
{
    case DAILY   = 'Daily';
    case WEEKLY  = 'Weekly';
    case MONTHLY = 'Monthly';

    public static function options(): array
    {
        $units = self::units();

        return collect(self::cases())
            ->map(fn (self $p) => [
                'value' => $p->value,
                'label' => ucfirst($p->value),
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
