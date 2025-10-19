<?php

return [
    // Enable the proxy debug endpoint. Default: false
    'proxy_debug_enabled' => (bool) env('PROXY_DEBUG_ENABLED', false),

    // Optional access token for the proxy debug endpoint. When set, callers
    // must supply it via query string (?t=TOKEN). Leave null to disable token check.
    'proxy_debug_token' => env('PROXY_DEBUG_TOKEN'),
];
