<?php

return [
    'booking' => [
        'requested' => [
            'title'   => 'Permintaan booking baru',
            'message' => 'Booking :number telah diajukan.',
        ],
        'approved' => [
            'title'   => 'Booking disetujui',
            'message' => 'Booking :number Anda telah disetujui.',
        ],
        'rejected' => [
            'title'   => 'Booking ditolak',
            'message' => 'Booking :number Anda ditolak.',
        ],
    ],

    'invoice' => [
        'created' => [
            'title'   => 'Tagihan baru',
            'message' => 'Tagihan :number telah diterbitkan.',
        ],
        'due_extended' => [
            'title'   => 'Jatuh tempo tagihan diperpanjang',
            'message' => 'Jatuh tempo tagihan :number diubah ke :due.',
        ],
        'cancelled' => [
            'title'   => 'Tagihan dibatalkan',
            'message' => 'Tagihan :number telah dibatalkan.',
        ],
    ],

    'payment' => [
        'submitted' => [
            'title'   => 'Pembayaran diajukan',
            'message' => 'Pembayaran untuk tagihan :invoice telah diajukan.',
        ],
        'confirmed' => [
            'title'   => 'Pembayaran dikonfirmasi',
            'message' => 'Pembayaran untuk tagihan :invoice telah dikonfirmasi.',
        ],
        'rejected' => [
            'title'   => 'Pembayaran ditolak',
            'message' => 'Pembayaran untuk tagihan :invoice ditolak.',
        ],
    ],

    'contract' => [
        'created' => [
            'title'   => 'Kontrak dibuat',
            'message' => 'Kontrak Anda telah dibuat.',
        ],
        'cancelled' => [
            'title'   => 'Kontrak dibatalkan',
            'message' => 'Kontrak Anda telah dibatalkan.',
        ],
        'autorenew' => [
            'enabled' => [
                'title'   => 'Perpanjang otomatis diaktifkan',
                'message' => 'Perpanjang otomatis untuk kontrak Anda diaktifkan.',
            ],
            'disabled' => [
                'title'   => 'Perpanjang otomatis dimatikan',
                'message' => 'Perpanjang otomatis untuk kontrak Anda dimatikan.',
            ],
        ],
    ],

    'handover' => [
        'checkin' => [
            'title'   => 'Check-in dicatat',
            'message' => 'Check-in kamar Anda telah dicatat.',
        ],
        'checkout' => [
            'title'   => 'Check-out dicatat',
            'message' => 'Check-out kamar Anda telah dicatat.',
        ],
        'confirmed' => [
            'title'   => 'Handover dikonfirmasi',
            'message' => 'Tenant mengonfirmasi handover.',
        ],
        'disputed' => [
            'title'   => 'Handover disengketakan',
            'message' => 'Tenant mengajukan sanggahan handover.',
        ],
    ],

    'document' => [
        'approved' => [
            'title'   => 'Dokumen identitas disetujui',
            'message' => 'Dokumen identitas Anda telah disetujui.',
        ],
        'rejected' => [
            'title'   => 'Dokumen identitas ditolak',
            'message' => 'Dokumen identitas Anda ditolak.',
        ],
    ],

    'testimony' => [
        'status' => [
            'title'   => 'Status testimoni diperbarui',
            'message' => 'Status testimoni Anda berubah menjadi :status.',
        ],
    ],
];
