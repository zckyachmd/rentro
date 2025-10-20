<?php

/*
|--------------------------------------------------------------------------
| Config: diagnostics
|--------------------------------------------------------------------------
| Purpose: Control internal diagnostics endpoints and access policy.
| Keys:
| - proxy_debug_enabled (env PROXY_DEBUG_ENABLED): Toggle the proxy debug endpoint.
|   Defaults to true on non-production APP_ENV.
| - proxy_debug_token (env PROXY_DEBUG_TOKEN): Optional shared token required
|   via query (?t=TOKEN) to access the endpoint. Null disables token check.
*/

return [
    // Enable the proxy debug endpoint.
    // Default: enabled in non-production, disabled in production.
    'proxy_debug_enabled' => (bool) env('PROXY_DEBUG_ENABLED', env('APP_ENV', 'production') !== 'production'),

    // Optional access token for the proxy debug endpoint. When set, callers
    // must supply it via query string (?t=TOKEN). Leave null to disable token check.
    'proxy_debug_token' => env('PROXY_DEBUG_TOKEN'),
];
