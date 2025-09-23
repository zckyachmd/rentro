<?php

return [
    'address_label' => [
        'home'           => 'Rumah',
        'office'         => 'Kantor',
        'campus'         => 'Kampus',
        'apartment'      => 'Apartemen',
        'boarding_house' => 'Kost',
        'parent_house'   => 'Rumah Orang Tua',
        'other'          => 'Lainnya',
    ],

    'emergency_relationship' => [
        'parent'    => 'Orang Tua',
        'sibling'   => 'Saudara Kandung',
        'relative'  => 'Keluarga Lain',
        'spouse'    => 'Pasangan',
        'friend'    => 'Teman Dekat',
        'guardian'  => 'Wali',
        'roommate'  => 'Teman Sekamar',
        'colleague' => 'Rekan Kerja',
        'neighbor'  => 'Tetangga',
    ],

    'gender' => [
        'male'   => 'Pria',
        'female' => 'Wanita',
    ],

    'gender_policy' => [
        'any'    => 'Bebas',
        'male'   => 'Pria',
        'female' => 'Wanita',
    ],

    'document' => [
        'status' => [
            'pending'  => 'Menunggu',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
        ],
        'type' => [
            'ktp'      => 'KTP',
            'sim'      => 'SIM',
            'passport' => 'Paspor',
            'npwp'     => 'NPWP',
            'other'    => 'Lainnya',
        ],
    ],

    'invoice' => [
        'status' => [
            'pending'   => 'Menunggu',
            'overdue'   => 'Terlambat',
            'paid'      => 'Lunas',
            'cancelled' => 'Dibatalkan',
        ],
    ],

    'payment' => [
        'method' => [
            'cash'            => 'Tunai',
            'transfer'        => 'Transfer',
            'virtual_account' => 'Virtual Account',
        ],
        'status' => [
            'review'    => 'Review',
            'pending'   => 'Menunggu',
            'completed' => 'Berhasil',
            'failed'    => 'Gagal',
            'rejected'  => 'Ditolak',
            'cancelled' => 'Dibatalkan',
        ],
    ],

    'contract' => [
        'status' => [
            'pending_payment' => 'Menunggu Pembayaran',
            'overdue'         => 'Terlambat',
            'cancelled'       => 'Dibatalkan',
            'booked'          => 'Dipesan',
            'active'          => 'Aktif',
            'completed'       => 'Selesai',
        ],
    ],

    'room' => [
        'status' => [
            'vacant'      => 'Kosong',
            'reserved'    => 'Dipesan',
            'occupied'    => 'Terisi',
            'maintenance' => 'Perawatan',
            'inactive'    => 'Nonaktif',
        ],
        'type' => [
            'standard' => 'Standard',
            'deluxe'   => 'Deluxe',
            'suite'    => 'Suite',
            'economy'  => 'Ekonomi',
        ],
    ],

    'billing_period' => [
        'daily'   => 'Harian',
        'weekly'  => 'Mingguan',
        'monthly' => 'Bulanan',
    ],

    'locale' => [
        'en' => 'Inggris',
        'id' => 'Indonesia',
    ],

    'theme' => [
        'light'  => 'Terang',
        'dark'   => 'Gelap',
        'system' => 'Sistem',
    ],
];
