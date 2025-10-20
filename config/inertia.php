<?php

/*
|--------------------------------------------------------------------------
| Config: inertia
|--------------------------------------------------------------------------
| Purpose: Configure Inertia.js integration including SSR and testing.
| Sections:
| - ssr.* (env INERTIA_*): Enable SSR and tune SSR gateway URL/timeouts.
| - testing.*: Component discovery for testing utilities.
*/

return [

    /*
    |--------------------------------------------------------------------------
    | Server Side Rendering
    |--------------------------------------------------------------------------
    |
    | These options configures if and how Inertia uses Server Side Rendering
    | to pre-render each initial request made to your application's pages
    | so that server rendered HTML is delivered for the user's browser.
    |
    | See: https://inertiajs.com/server-side-rendering
    |
    */

    'ssr' => [
        // Enable SSR pre-rendering for initial page responses.
        // Impacts: Faster first paint, requires SSR server.
        'enabled' => env('INERTIA_SSR_ENABLED', false),

        // SSR gateway URL (http(s)://host:port). Used by Laravel SSR Gateway.
        // Impacts: Where server makes SSR rendering requests.
        'url' => env('INERTIA_SSR_URL', 'http://ssr:13714'),

        // Alternative: path to local SSR bundle (when using Node worker process).
        // 'bundle' => base_path('bootstrap/ssr/ssr.mjs'),

        // When true, will verify SSR bundle exists at boot to avoid runtime errors.
        'ensure_bundle_exists' => true,

        // Connection timeout to SSR gateway (seconds).
        'connect_timeout' => env('INERTIA_SSR_CONNECT_TIMEOUT', 1.0),
        // Total SSR request timeout (seconds).
        'timeout' => env('INERTIA_SSR_TIMEOUT', 2.0),

    ],

    /*
    |--------------------------------------------------------------------------
    | Testing
    |--------------------------------------------------------------------------
    |
    | The values described here are used to locate Inertia components on the
    | filesystem. For instance, when using `assertInertia`, the assertion
    | attempts to locate the component as a file relative to the paths.
    |
    */

    'testing' => [
        // Validate that referenced pages exist during testing assertions.
        'ensure_pages_exist' => true,

        // Root directories to discover Inertia page components for testing.
        'page_paths' => [
            resource_path('js/pages'),
        ],

        // File extensions treated as page components.
        'page_extensions' => [
            'js',
            'jsx',
            'svelte',
            'ts',
            'tsx',
            'vue',
        ],

    ],

];
