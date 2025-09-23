<?php

return [
    'contract_invalid_for_generation' => 'Kontrak tidak valid untuk generate invoice.',
    'contract_already_paid_in_full'   => 'Kontrak sudah lunas penuh.',
    'no_missing_months'               => 'Tidak ada bulan tertinggal untuk digenerate.',
    'generate_backfill_success'       => 'Berhasil generate :count bulan tertinggal.',
    'generate_backfill_failed'        => 'Tidak dapat generate bulan tertinggal.',
    'period_month_required'           => 'Bulan periode wajib dipilih untuk mode Bulanan.',
    'period_month_invalid'            => 'Format bulan periode tidak valid.',
    'period_month_out_of_range'       => 'Bulan yang dipilih berada di luar masa kontrak.',
    'generate_failed_generic'         => 'Gagal generate invoice.',
    'created'                         => 'Invoice berhasil dibuat.',
    'not_found'                       => 'Invoice tidak ditemukan.',
    'extend' => [
        'only_pending_overdue' => 'Hanya invoice Pending atau Overdue yang dapat diperpanjang.',
        'invalid_due_format'   => 'Format tanggal jatuh tempo tidak valid.',
        'due_must_be_greater'  => 'Tanggal jatuh tempo baru harus lebih besar dari tanggal sebelumnya (:current).',
        'failed'               => 'Gagal memperpanjang jatuh tempo.',
        'not_extendable'       => 'Invoice tidak dapat diperpanjang.',
        'success'              => 'Masa tenggat invoice berhasil diperpanjang.',
    ],
    'cancel' => [
        'already_paid'         => 'Invoice sudah dibayar dan tidak dapat dibatalkan.',
        'has_completed_payment' => 'Invoice memiliki pembayaran yang sudah selesai dan tidak dapat dibatalkan.',
        'failed'               => 'Gagal membatalkan invoice.',
        'success'              => 'Invoice dibatalkan.',
        'already_cancelled'    => 'Invoice sudah dalam status Cancelled.',
    ],
];
