<?php

/*
|--------------------------------------------------------------------------
| Config: vite
|--------------------------------------------------------------------------
| Purpose: Vite asset pipeline integration.
| Keys:
| - concurrency (env VITE_CONCURRENCY): Max concurrent prefetch requests.
*/

return [
    // Maximum number of concurrent prefetch requests Vite should perform.
    // Keep small to avoid overwhelming the server in production.
    'concurrency' => (int) env('VITE_CONCURRENCY', 4),
];
