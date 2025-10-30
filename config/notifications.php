<?php

return [
    // Whether the global broadcast channel should be private (auth required)
    // If false, a public channel named `global` will be used
    'global_private' => env('BROADCAST_GLOBAL_PRIVATE', false),

    // Name of the global broadcast channel
    'global_channel' => env('BROADCAST_GLOBAL_CHANNEL', 'global'),

    // Batch size for fan-out operations to persist notifications per user
    'fanout_chunk' => env('NOTIFICATIONS_FANOUT_CHUNK', 1000),

    // Management roles to notify for tenant-originated events (by role name)
    // You can configure multiple role names per event
    'management_roles' => [
        // When tenant creates a booking request
        'booking_requested' => explode(',', (string) env('NOTIFY_ROLES_BOOKING_REQUESTED', 'Manager')),
        // When tenant submits a manual payment
        'payment_submitted' => explode(',', (string) env('NOTIFY_ROLES_PAYMENT_SUBMITTED', 'Manager')),
        // When tenant acknowledges a handover
        'handover_confirmed' => explode(',', (string) env('NOTIFY_ROLES_HANDOVER_CONFIRMED', 'Manager')),
        // When tenant disputes a handover
        'handover_disputed' => explode(',', (string) env('NOTIFY_ROLES_HANDOVER_DISPUTED', 'Manager')),
    ],
];
