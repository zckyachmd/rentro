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
];
