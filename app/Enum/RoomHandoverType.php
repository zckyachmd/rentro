<?php

namespace App\Enum;

enum RoomHandoverType: string
{
    case CHECKIN  = 'checkin';
    case CHECKOUT = 'checkout';

    public function label(): string
    {
        return __('enum.handover.type.' . strtolower($this->name));
    }

    /**
     * @return array<int, array{value:string,label:string}>
     */
    public static function options(): array
    {
        return collect(self::cases())
            ->map(fn (self $c) => ['value' => $c->value, 'label' => $c->label()])
            ->values()
            ->all();
    }
}
