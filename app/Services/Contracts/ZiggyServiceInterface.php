<?php

namespace App\Services\Contracts;

use Illuminate\Http\Request;

interface ZiggyServiceInterface
{
    /**
     * Return filtered Ziggy payload for the given request/user, with caching.
     *
     * @return array<string,mixed>
     */
    public function forRequest(Request $request): array;
}
