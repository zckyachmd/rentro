<?php

return [
    'invoice_already_paid'        => 'Invoice is already paid.',
    'amount_positive'             => 'Payment amount must be greater than 0.',
    'amount_exceeds_outstanding'  => 'Amount exceeds outstanding.',
    'created'                     => 'Payment recorded successfully.',
    'void' => [
        'already' => 'Payment was already voided.',
        'success' => 'Payment voided and outstanding restored.',
    ],
    'ack' => [
        'invalid_state' => 'Only transfer payments with Review/Pending status can be processed.',
        'confirmed'     => 'Payment confirmed and marked as Paid.',
        'rejected'      => 'Payment rejected.',
    ],
];
