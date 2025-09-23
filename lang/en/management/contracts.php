<?php

return [
    'created' => 'Contract created successfully.',
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
