<?php

use App\Enum\RoleName;

return [
    // Whether the global broadcast channel should be private (auth required)
    // If false, a public channel named `global` will be used
    'global_private' => env('BROADCAST_GLOBAL_PRIVATE', false),

    // Name of the global broadcast channel
    'global_channel' => env('BROADCAST_GLOBAL_CHANNEL', 'global'),

    // Batch size for fan-out operations to persist notifications per user
    'fanout_chunk' => env('NOTIFICATIONS_FANOUT_CHUNK', 1000),

    // Prefix for per-user private broadcast channels, e.g. "user." -> "user.{id}"
    'user_channel_prefix' => env('NOTIFICATIONS_USER_CHANNEL_PREFIX', 'user.'),

    // Management roles to notify for tenant-originated events (by role name)
    // You can configure multiple role names per event
    'management_roles' => [
        // When tenant creates a booking request
        'booking_requested' => array_filter(explode(',', (string) env('NOTIFY_ROLES_BOOKING_REQUESTED', ''))) ?: [RoleName::SUPER_ADMIN->value, RoleName::MANAGER->value],
        // When tenant submits a manual payment
        'payment_submitted' => array_filter(explode(',', (string) env('NOTIFY_ROLES_PAYMENT_SUBMITTED', ''))) ?: [RoleName::SUPER_ADMIN->value, RoleName::MANAGER->value],
        // When tenant acknowledges a handover
        'handover_confirmed' => array_filter(explode(',', (string) env('NOTIFY_ROLES_HANDOVER_CONFIRMED', ''))) ?: [RoleName::SUPER_ADMIN->value, RoleName::MANAGER->value],
        // When tenant disputes a handover
        'handover_disputed' => array_filter(explode(',', (string) env('NOTIFY_ROLES_HANDOVER_DISPUTED', ''))) ?: [RoleName::SUPER_ADMIN->value, RoleName::MANAGER->value],
    ],
];
