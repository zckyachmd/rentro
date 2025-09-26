<?php

namespace App\Enum;

enum PaymentMethod: string
{
    case CASH            = 'cash';
    case TRANSFER        = 'transfer';
    case VIRTUAL_ACCOUNT = 'virtual_account';

    public function label(): string
    {
        return __('enum.payment.method.' . strtolower($this->name));
    }

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
            'label' => $m->label(),
        ], $cases));
    }
}
