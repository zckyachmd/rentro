<?php

return [
    'created' => 'Kontrak berhasil dibuat.',
    'errors' => [
        'schedule_conflict'          => 'Jadwal kamar bentrok dengan kontrak lain.',
        'active_missing_end_date'    => 'Tidak dapat memesan: kontrak aktif tidak memiliki tanggal berakhir.',
        'start_must_be_after_active_end' => 'Tanggal mulai harus setelah tanggal berakhir kontrak saat ini.',
        'cannot_prebook_yet'         => 'Kamar belum dapat dipesan saat ini. Hanya dapat dipesan :days hari sebelum kontrak berakhir dan jika auto‑renew nonaktif.',
        'future_booking_exists'      => 'Kamar sudah memiliki pemesanan berikutnya.',
    ],
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
