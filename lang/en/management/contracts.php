<?php

return [
    'created' => 'Contract created successfully.',
    'errors' => [
        'schedule_conflict'          => 'Room schedule conflicts with another contract.',
        'active_missing_end_date'    => 'Cannot prebook: active contract has no end date.',
        'start_must_be_after_active_end' => 'Start date must be after the current contract end date.',
        'cannot_prebook_yet'         => 'Room cannot be prebooked yet. Only allowed :days days before end and when auto‑renew is off.',
        'future_booking_exists'      => 'The room already has a next booking.',
    ],
    'cancel' => [
        'not_allowed'              => 'Contract cannot be cancelled. Only Pending Payment or Booked contracts can be cancelled.',
        'not_allowed_due_payments' => 'Contract cannot be cancelled due to completed payments or fully paid invoices.',
        'failed'                   => 'Contract cannot be cancelled.',
    ],
    'cancelled' => 'Contract cancelled.',
    'autorenew' => [
        'only_active' => 'Only Active contracts can stop auto-renew.',
        'enabled'     => 'Auto‑renew enabled.',
        'disabled'    => 'Auto‑renew disabled.',
    ],
];
