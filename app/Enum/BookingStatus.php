<?php

namespace App\Enum;

enum BookingStatus: string
{
    case REQUESTED = 'requested';
    case APPROVED  = 'approved';
    case REJECTED  = 'rejected';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return __('enum.booking.status.' . strtolower($this->name));
    }

    public static function options(): array
    {
        return collect(self::cases())
            ->map(fn (self $s) => ['value' => $s->value, 'label' => $s->label()])
            ->values()
            ->all();
    }
}
