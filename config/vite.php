<?php

/*
|--------------------------------------------------------------------------
| Config: vite
|--------------------------------------------------------------------------
| Purpose: Centralize Laravel↔Vite integration options for CSR/SSR and SEO.
| Notes:
| - Most knobs are optional; sensible defaults mirror the framework.
| - Prefetch can improve TTI for CSR and SSR hydration; tune carefully.
*/

return [
    // Backward-compatibility: legacy flat key used in earlier versions
    // of this project. Prefer `prefetch.concurrency` going forward.
    'concurrency' => (int) env('VITE_CONCURRENCY', 4),

    // Core Vite facade settings
    'hot_file'          => env('VITE_HOT_FILE', 'public/hot'),
    'build_directory'   => env('VITE_BUILD_DIR', 'build'),
    'manifest_filename' => env('VITE_MANIFEST', 'manifest.json'),

    // Subresource Integrity. Set to string key in manifest or false to disable.
    // Works only if your manifest contains that key for each chunk.
    'integrity_key' => env('VITE_INTEGRITY_KEY', 'integrity'), // set to 'false' or false to disable

    // Content-Security-Policy nonce for script/style/preload tags.
    // Recommended: inject per-request nonce via middleware and call Vite::useCspNonce() there.
    // This config exists for simple deployments; leave null to skip.
    'csp' => [
        'nonce' => env('VITE_CSP_NONCE', null),
    ],

    // Prefetch strategy for module graph. See Illuminate\Foundation\Vite.
    'prefetch' => [
        // Toggle prefetching entirely.
        'enabled' => filter_var(env('VITE_PREFETCH_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
        // 'waterfall', 'aggressive', or null to skip strategy selection (uses waterfall if enabled).
        'strategy' => env('VITE_PREFETCH_STRATEGY', 'waterfall'),
        // Concurrency for waterfall strategy.
        'concurrency' => (int) env('VITE_CONCURRENCY', 4),
        // Window event name that triggers prefetching. Defaults to 'load'.
        'event' => env('VITE_PREFETCH_EVENT', 'load'),
    ],

    // Optional HTML tag attributes injected into Vite-generated tags.
    // You may provide arrays or callables in your own service provider; here we use simple arrays.
    'tags' => [
        // Example: ['defer' => true, 'crossorigin' => 'anonymous']
        'script_attributes' => [],
        'style_attributes'  => [],
        // Array to customize; set to false to disable generating preload tags.
        'preload_attributes' => [],
    ],

    // Default entry points (optional). Useful if using @vite without arguments.
    'entry_points' => [
        'default' => [
            'resources/css/app.css',
            'resources/js/app.tsx',
        ],
    ],
];
