<?php

namespace App\Enum;

enum PaymentMethod: string
{
    case CASH            = 'Cash';
    case TRANSFER        = 'Transfer';
    case VIRTUAL_ACCOUNT = 'VirtualAccount';

    /**
     * Return options for select inputs.
     * @param bool $excludeVirtualAccount
     * @return array<int, array{value:string,label:string}>
     */
    public static function options(bool $excludeVirtualAccount = false): array
    {
        $cases = self::cases();
        if ($excludeVirtualAccount) {
            $cases = array_filter($cases, fn (self $m) => $m !== self::VIRTUAL_ACCOUNT);
        }

        return array_values(array_map(fn (self $m) => [
            'value' => $m->value,
            'label' => $m->value,
        ], $cases));
    }
}
