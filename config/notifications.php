<?php

return [
    // Whether the global broadcast channel should be private (auth required)
    // If false, a public channel named `global` will be used
    'global_private' => env('BROADCAST_GLOBAL_PRIVATE', false),

    // Name of the global broadcast channel
    'global_channel' => env('BROADCAST_GLOBAL_CHANNEL', 'global'),

    // Batch size for fan-out operations to persist notifications per user
    'fanout_chunk' => env('NOTIFICATIONS_FANOUT_CHUNK', 1000),
];
