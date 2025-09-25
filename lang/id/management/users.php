<?php

return [
    'roles' => [
        'no_changes' => 'Tidak ada perubahan peran.',
        'updated'    => 'Peran pengguna berhasil diperbarui.',
    ],
    'email_missing'         => 'Pengguna tidak memiliki email.',
    'reset_link_sent'       => 'Tautan reset dikirim ke email pengguna.',
    'reset_link_generated'  => 'Tautan reset berhasil digenerate.',
    'reset_mode_invalid'    => 'Mode untuk tautan reset password tidak valid.',
    '2fa' => [
        'disabled' => 'Two-factor authentication dimatikan.',
    ],
    'sessions' => [
        'none'         => 'Tidak ada sesi yang perlu dihapus.',
        'deleted_count' => 'Berhasil menghapus :count sesi pengguna.',
    ],
    'recovery' => [
        'retrieved'   => 'Recovery codes berhasil diambil.',
        'regenerated' => 'Recovery codes telah dibuat ulang.',
    ],
    'invalid_mode' => 'Mode tidak valid.',
    'created'      => 'Pengguna berhasil dibuat.',
    'invite' => [
        'sent'   => 'Email undangan akun telah dikirim (berisi username & password sementara serta tautan ubah password).',
        'failed' => 'PERHATIAN: Email undangan akun gagal dikirim. Anda dapat mengirim secara manual dari halaman reset password.',
    ],
    'verify' => [
        'sent'   => 'Email verifikasi juga telah dikirim.',
        'failed' => 'Email verifikasi tidak terkirim. Pengguna dapat meminta verifikasi dari profil atau Anda dapat mengirim ulang.',
    ],
    'errors' => [
        'self_edit_forbidden'      => 'Anda tidak diperbolehkan mengubah peran Anda sendiri. Hubungi administrator.',
        'cannot_edit_super'        => 'Anda tidak memiliki izin untuk mengubah peran pengguna dengan peran Super Admin.',
        'cannot_remove_last_super' => 'Tidak dapat menghapus peran Super Admin terakhir. Minimal harus ada satu pengguna dengan peran Super Admin.',
    ],
];
