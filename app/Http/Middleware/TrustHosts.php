<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustHosts as Middleware;

class TrustHosts extends Middleware
{
    /**
     * Get the host patterns that should be trusted.
     *
     * @return array<int, string>
     */
    public function hosts()
    {
        $hosts = (string) config('trusted.hosts', '^.*$');
        $parts = array_values(array_filter(array_map('trim', preg_split('/[\s,|]+/', $hosts))));

        return $parts ?: ['^.*$'];
    }
}
