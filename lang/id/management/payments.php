<?php

return [
    'invoice_already_paid'        => 'Invoice sudah lunas.',
    'amount_positive'             => 'Nominal pembayaran harus lebih dari 0.',
    'amount_exceeds_outstanding'  => 'Nominal melebihi sisa tagihan.',
    'created'                     => 'Pembayaran berhasil dicatat.',
    'void' => [
        'already' => 'Pembayaran sudah dibatalkan sebelumnya.',
        'success' => 'Pembayaran dibatalkan (void) dan sisa tagihan dipulihkan.',
    ],
    'ack' => [
        'invalid_state' => 'Hanya pembayaran transfer yang berstatus Review/Pending yang dapat diproses.',
        'confirmed'     => 'Pembayaran dikonfirmasi dan ditandai sebagai Lunas.',
        'rejected'      => 'Pembayaran ditolak.',
    ],
];
