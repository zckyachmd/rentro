<?php

return [
    'created' => 'Kontrak berhasil dibuat.',
    'cancel' => [
        'not_allowed'              => 'Kontrak tidak dapat dibatalkan. Hanya kontrak Pending Payment atau Booked yang dapat dibatalkan.',
        'not_allowed_due_payments' => 'Kontrak tidak dapat dibatalkan karena terdapat pembayaran yang sudah selesai atau invoice yang sudah lunas.',
        'failed'                   => 'Kontrak tidak dapat dibatalkan.',
    ],
    'cancelled' => 'Kontrak dibatalkan.',
    'autorenew' => [
        'only_active' => 'Hanya kontrak berstatus Active yang dapat menghentikan perpanjangan otomatis.',
        'enabled'     => 'Auto‑renew dinyalakan.',
        'disabled'    => 'Auto‑renew dihentikan.',
    ],
];
