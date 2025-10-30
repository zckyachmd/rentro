<?php

return [
    'booking' => [
        'requested' => [
            'title'   => 'New booking request',
            'message' => 'Booking :number has been requested.',
        ],
        'approved' => [
            'title'   => 'Booking approved',
            'message' => 'Your booking :number has been approved.',
        ],
        'rejected' => [
            'title'   => 'Booking rejected',
            'message' => 'Your booking :number has been rejected.',
        ],
    ],

    'invoice' => [
        'created' => [
            'title'   => 'New invoice',
            'message' => 'Invoice :number has been issued.',
        ],
        'due_extended' => [
            'title'   => 'Invoice due date extended',
            'message' => 'Invoice :number due date updated to :due.',
        ],
        'cancelled' => [
            'title'   => 'Invoice cancelled',
            'message' => 'Invoice :number has been cancelled.',
        ],
    ],

    'payment' => [
        'submitted' => [
            'title'   => 'Payment submitted',
            'message' => 'Payment submitted for invoice :invoice.',
        ],
        'confirmed' => [
            'title'   => 'Payment confirmed',
            'message' => 'Payment for invoice :invoice has been confirmed.',
        ],
        'rejected' => [
            'title'   => 'Payment rejected',
            'message' => 'Payment for invoice :invoice was rejected.',
        ],
    ],

    'contract' => [
        'created' => [
            'title'   => 'Contract created',
            'message' => 'Your contract has been created.',
        ],
        'cancelled' => [
            'title'   => 'Contract cancelled',
            'message' => 'Your contract has been cancelled.',
        ],
        'autorenew' => [
            'enabled' => [
                'title'   => 'Auto-renew enabled',
                'message' => 'Your contract auto-renew has been enabled.',
            ],
            'disabled' => [
                'title'   => 'Auto-renew disabled',
                'message' => 'Your contract auto-renew has been disabled.',
            ],
        ],
    ],

    'handover' => [
        'checkin' => [
            'title'   => 'Check-in recorded',
            'message' => 'Your room check-in has been recorded.',
        ],
        'checkout' => [
            'title'   => 'Check-out recorded',
            'message' => 'Your room check-out has been recorded.',
        ],
        'confirmed' => [
            'title'   => 'Handover confirmed',
            'message' => 'Tenant confirmed a handover.',
        ],
        'disputed' => [
            'title'   => 'Handover disputed',
            'message' => 'Tenant submitted a handover dispute.',
        ],
    ],

    'document' => [
        'approved' => [
            'title'   => 'Identity document approved',
            'message' => 'Your identity document has been approved.',
        ],
        'rejected' => [
            'title'   => 'Identity document rejected',
            'message' => 'Your identity document has been rejected.',
        ],
    ],

    'testimony' => [
        'status' => [
            'title'   => 'Testimony status updated',
            'message' => 'Your testimony status changed to :status.',
        ],
    ],
];
