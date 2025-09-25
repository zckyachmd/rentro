<?php

return [
    'checkin_created'  => 'Check-in berhasil dibuat.',
    'checkout_created' => 'Check-out berhasil dibuat.',
    'attributes' => [
        'notes'       => 'catatan',
        'attachments' => 'lampiran',
    ],
    'validation' => [
        'files' => [
            'general' => [
                'required' => 'Harap unggah foto sebagai eviden.',
                'min'      => 'Minimal unggah :min foto sebagai eviden.',
            ],
        ],
    ],
    'errors' => [
        'invalid_for_checkin'     => 'Kontrak tidak valid untuk check-in.',
        'start_date_not_reached'  => 'Tanggal mulai kontrak belum tiba.',
        'pending_checkin_exists'  => 'Masih ada check-in yang menunggu konfirmasi tenant.',
        'invalid_for_checkout'    => 'Kontrak tidak valid untuk check-out.',
        'no_confirmed_checkin'    => 'Belum ada check-in yang terkonfirmasi. Ulangi proses check-in dan pastikan persetujuan tenant.',
        'checkout_already_exists' => 'Check-out sudah dibuat.',
    ],
];
