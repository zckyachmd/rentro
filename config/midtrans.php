<?php

return [
    // Toggle production vs sandbox
    'is_production' => (bool) env('MIDTRANS_PRODUCTION', false),

    // Credentials
    'server_key' => env('MIDTRANS_SERVER_KEY', ''),
    'client_key' => env('MIDTRANS_CLIENT_KEY', ''),

    // Optional tuning
    'timeouts' => [
        'connect' => (int) env('MIDTRANS_CONNECT_TIMEOUT', 10),
        'total'   => (int) env('MIDTRANS_TOTAL_TIMEOUT', 30),
    ],

    // Optional: Set default expiry for VA/QRIS (in minutes). 0 to disable.
    'expiry_minutes' => (int) env('MIDTRANS_EXPIRY_MINUTES', 0),

    // Expose available VA banks to client (lowercase codes)
    // Defaults to common banks; override via env MIDTRANS_VA_BANKS="bca,bni,bri,permata,cimb"
    'va_banks' => array_values(array_filter(array_map(
        fn ($b) => strtolower(trim($b)),
        explode(',', (string) env('MIDTRANS_VA_BANKS', 'bca,bni,bri,permata,cimb')),
    ))),
];
