<?php

namespace App\Enum;

enum GenderPolicy: string
{
    case ANY    = 'any';
    case MALE   = 'male';
    case FEMALE = 'female';

    public function label(): string
    {
        return __('enum.gender_policy.' . strtolower($this->name));
    }

    /**
     * @return array<int, array{value:string,label:string}>
     */
    public static function options(): array
    {
        return array_map(
            static fn (self $c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ],
            self::cases(),
        );
    }
}
