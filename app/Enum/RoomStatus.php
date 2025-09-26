<?php

namespace App\Enum;

enum RoomStatus: string
{
    case VACANT      = 'vacant';       // kosong, siap sewa
    case RESERVED    = 'reserved';     // dipesan, menunggu bayar/cek-in
    case OCCUPIED    = 'occupied';     // terisi
    case MAINTENANCE = 'maintenance';  // perbaikan
    case INACTIVE    = 'inactive';     // non-aktif (tidak dipasarkan)

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
                'label' => $c->label(),
            ])
            ->values()
            ->all();
    }

    public function label(): string
    {
        return __('enum.room.status.' . strtolower($this->name));
    }
}
