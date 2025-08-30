<?php

namespace App\Enum;

enum RoomStatus: string
{
    case VACANT      = 'Vacant';       // kosong, siap sewa
    case RESERVED    = 'Reserved';     // dipesan, menunggu bayar/cek-in
    case OCCUPIED    = 'Occupied';     // terisi
    case MAINTENANCE = 'Maintenance';  // perbaikan
    case INACTIVE    = 'Inactive';     // non-aktif (tidak dipasarkan)

    /**
     * Get options array for select inputs.
     *
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return collect(self::cases())
            ->map(fn (self $c) => [
                'value' => $c->value,
                'label' => $c->value,
            ])
            ->values()
            ->all();
    }
}
