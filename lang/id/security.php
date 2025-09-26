<?php

return [
    'password_updated' => 'Password berhasil diperbarui.',
    'sessions' => [
        'revoked_others'        => 'Berhasil logout dari semua sesi lain.',
        'not_found_or_not_owned' => 'Sesi tidak ditemukan atau bukan milik Anda.',
        'cannot_logout_current' => 'Anda tidak dapat logout sesi saat ini dari sini.',
    ],
    'session' => [
        'logged_out' => 'Sesi berhasil di-logout.',
    ],
    '2fa' => [
        'prepare_started' => 'Persiapan 2FA dimulai. Scan QR & konfirmasi OTP.',
        'not_initiated'   => '2FA belum diinisiasi.',
        'invalid_code'    => 'Kode OTP tidak valid atau kedaluwarsa.',
        'confirmed'       => '2FA berhasil dikonfirmasi.',
        'none_to_cancel'  => 'Tidak ada proses 2FA yang perlu dibatalkan.',
        'cancelled'       => 'Proses 2FA dibatalkan.',
        'disabled'        => '2FA dinonaktifkan.',
        'recovery'        => [
            'needs_enabled' => 'Aktifkan & konfirmasi 2FA terlebih dahulu.',
            'updated'       => 'Recovery codes diperbarui.',
        ],
    ],
];
