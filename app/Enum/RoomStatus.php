<?php

namespace App\Enum;

enum RoomStatus: string
{
    case VACANT      = 'vacant';       // kosong, siap sewa
    case RESERVED    = 'reserved';     // dipesan, menunggu bayar/cek-in
    case OCCUPIED    = 'occupied';     // terisi
    case MAINTENANCE = 'maintenance';  // perbaikan
    case INACTIVE    = 'inactive';     // non-aktif (tidak dipasarkan)
}
