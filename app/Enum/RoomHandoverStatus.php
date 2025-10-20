<?php

namespace App\Enum;

enum RoomHandoverStatus: string
{
    case PENDING   = 'pending';
    case CONFIRMED = 'confirmed';
    case DISPUTED  = 'disputed';

    public function label(): string
    {
        return __('enum.handover.status.' . strtolower($this->name));
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
