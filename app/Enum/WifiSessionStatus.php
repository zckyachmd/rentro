<?php

namespace App\Enum;

enum WifiSessionStatus: string
{
    case AUTH    = 'auth';
    case BLOCKED = 'blocked';
    case REVOKED = 'revoked';
    case EXPIRED = 'expired';
    case PENDING = 'pending';

    public function label(): string
    {
        return __('enum.wifi.session.status.' . strtolower($this->name));
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
