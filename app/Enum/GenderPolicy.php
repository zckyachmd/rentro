<?php

namespace App\Enum;

enum GenderPolicy: string
{
    case ANY    = 'any';
    case MALE   = 'male';
    case FEMALE = 'female';

    /**
     * @return array<int, array{value:string,label:string}>
     */
    public static function options(): array
    {
        return collect(self::cases())
            ->map(fn (self $c) => [
                'value' => $c->value,
                'label' => match ($c) {
                    self::ANY    => 'Bebas',
                    self::MALE   => 'Pria',
                    self::FEMALE => 'Wanita',
                },
            ])
            ->values()
            ->all();
    }
}
