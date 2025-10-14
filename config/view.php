<?php

return [

    // Paths to your Blade views
    'paths' => [
        resource_path('views'),
    ],

    // Compiled Blade templates directory
    'compiled' => env('VIEW_COMPILED_PATH', realpath(storage_path('framework/views'))),

    // Whether to cache compiled views
    'cache' => env('VIEW_CACHE', true),

    // Additional options supported by Laravel 11/12
    'relative_hash'          => false,
    'compiled_extension'     => 'php',
    'check_cache_timestamps' => true,

];
