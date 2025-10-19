<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies as Middleware;
use Symfony\Component\HttpFoundation\Request as SymfonyRequest;

class TrustProxies extends Middleware
{
    /**
     * The trusted proxies for this application.
     *
     * @var array<int, string>|string|null
     */
    protected $proxies;

    /**
     * The headers that should be used to detect proxies.
     *
     * @var int
     */
    protected $headers = SymfonyRequest::HEADER_X_FORWARDED_FOR
        | SymfonyRequest::HEADER_X_FORWARDED_HOST
        | SymfonyRequest::HEADER_X_FORWARDED_PORT
        | SymfonyRequest::HEADER_X_FORWARDED_PROTO
        | SymfonyRequest::HEADER_X_FORWARDED_PREFIX;

    public function __construct()
    {
        // Read from configuration (cache-safe). Accepts '*', null, CSV or array.
        $configured = config('trusted.proxies');

        // Explicit '*' handling even if provided as string
        if (is_string($configured) && trim($configured) === '*') {
            $this->proxies = '*';
        } elseif (is_string($configured)) {
            $value = trim($configured);
            if ($value === '' || strtolower($value) === 'null') {
                $this->proxies = null;
            } else {
                $parts         = preg_split('/[\s,]+/', $value) ?: [];
                $this->proxies = array_values(array_filter(array_map('trim', $parts)));
            }
        } elseif (is_array($configured)) {
            // Assume already a list of proxies/CIDRs
            $this->proxies = $configured;
        } elseif ($configured === null) {
            $this->proxies = null;
        } else {
            // Default: trust all (sensible for containerized / ingress envs)
            $this->proxies = '*';
        }

        $headers = (int) config('trusted.headers');
        if ($headers) {
            $this->headers = $headers;
        }
    }
}
