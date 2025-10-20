<?php

use Symfony\Component\HttpFoundation\Request as SymfonyRequest;

/*
|--------------------------------------------------------------------------
| Config: trusted
|--------------------------------------------------------------------------
| Purpose: Configure trusted proxies and forwarded header handling.
| Keys:
| - proxies (env TRUSTED_PROXIES): CSV/CIDR list or '*' to trust all.
| - headers: Bitmask of forwarded headers honored from proxies.
| - hosts (env TRUSTED_HOSTS): Regex pattern(s) of allowed hosts.
*/

return [
    // Comma-separated list of proxies or CIDRs (e.g., "10.0.0.0/8, 172.16.0.0/12").
    // Use "*" to trust all proxies (typical in container / ingress / Cloudflare setups).
    'proxies' => env('TRUSTED_PROXIES', '*'),

    // Forwarded headers mask to honor from proxies.
    'headers' => (
        SymfonyRequest::HEADER_X_FORWARDED_FOR
        | SymfonyRequest::HEADER_X_FORWARDED_HOST
        | SymfonyRequest::HEADER_X_FORWARDED_PORT
        | SymfonyRequest::HEADER_X_FORWARDED_PROTO
        | SymfonyRequest::HEADER_X_FORWARDED_PREFIX
    ),

    // Trusted host regex patterns. Separate multiple with comma or pipe.
    // Default allows all hosts (useful for tunnels); tighten in production.
    'hosts' => env('TRUSTED_HOSTS', '^.*$'),
];
