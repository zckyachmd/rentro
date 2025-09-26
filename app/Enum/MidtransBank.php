<?php

namespace App\Enum;

enum MidtransBank: string
{
    case BCA     = 'bca';
    case BNI     = 'bni';
    case BRI     = 'bri';
    case PERMATA = 'permata';
    case CIMB    = 'cimb';

    public static function normalize(string $bank): string
    {
        $b = strtolower(trim($bank));
        try {
            return self::from($b)->value;
        } catch (\ValueError) {
            throw new \InvalidArgumentException('Unsupported bank: ' . $bank);
        }
    }

    public static function values(): array
    {
        return array_map(static fn (self $c) => $c->value, self::cases());
    }
}
