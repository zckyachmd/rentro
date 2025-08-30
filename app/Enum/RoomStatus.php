<?php

namespace App\Enum;

enum RoomStatus: string
{
    case VACANT      = 'Vacant';       // kosong, siap sewa
    case RESERVED    = 'Reserved';     // dipesan, menunggu bayar/cek-in
    case OCCUPIED    = 'Occupied';     // terisi
    case MAINTENANCE = 'Maintenance';  // perbaikan
    case INACTIVE    = 'Inactive';     // non-aktif (tidak dipasarkan)
}
