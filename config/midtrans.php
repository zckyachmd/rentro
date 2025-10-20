<?php

/*
|--------------------------------------------------------------------------
| Config: midtrans
|--------------------------------------------------------------------------
| Purpose: Configure Midtrans payment gateway integration.
| Keys:
| - is_production (env MIDTRANS_PRODUCTION): Use production or sandbox endpoints.
| - server_key (env MIDTRANS_SERVER_KEY): API server key.
| - client_key (env MIDTRANS_CLIENT_KEY): API client key.
| - timeouts.connect (env MIDTRANS_CONNECT_TIMEOUT): Connect timeout seconds.
| - timeouts.total (env MIDTRANS_TOTAL_TIMEOUT): Total request timeout seconds.
| - expiry_minutes (env MIDTRANS_EXPIRY_MINUTES): Default VA/QRIS expiry in minutes (0 = disabled).
| - va_banks (env MIDTRANS_VA_BANKS): CSV of VA bank codes exposed to clients.
*/

return [
    // Switch between Midtrans production and sandbox environments.
    // Impacts: API base URL and behavior.
    'is_production' => (bool) env('MIDTRANS_PRODUCTION', false),

    // API credentials. Server key is used for server-side charge/refund calls,
    // client key is embedded in frontend for Snap, etc.
    // Impacts: authentication to Midtrans endpoints.
    'server_key' => env('MIDTRANS_SERVER_KEY', ''),
    'client_key' => env('MIDTRANS_CLIENT_KEY', ''),

    // Network timeouts for calling Midtrans APIs.
    // Impacts: request behavior under slow networks.
    'timeouts' => [
        // Seconds to wait when establishing TCP connection.
        'connect' => (int) env('MIDTRANS_CONNECT_TIMEOUT', 10),
        // Maximum total request time in seconds.
        'total' => (int) env('MIDTRANS_TOTAL_TIMEOUT', 30),
    ],

    // Default expiration for VA/QRIS payments (minutes). 0 disables custom expiry.
    // Impacts: transaction lifetime shown to customers.
    'expiry_minutes' => (int) env('MIDTRANS_EXPIRY_MINUTES', 0),

    // List of supported VA banks exposed to the client (lowercase codes).
    // Impacts: FE selection options when initiating VA payments.
    // Defaults to common banks; override via MIDTRANS_VA_BANKS="bca,bni,bri,permata,cimb"
    'va_banks' => array_values(array_filter(array_map(
        fn ($b) => strtolower(trim($b)),
        explode(',', (string) env('MIDTRANS_VA_BANKS', 'bca,bni,bri,permata,cimb')),
    ))),
];
