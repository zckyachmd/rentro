<?php

/*
|--------------------------------------------------------------------------
| Config: view
|--------------------------------------------------------------------------
| Purpose: Blade view system settings.
| Keys:
| - paths: Directories to search for Blade templates.
| - compiled (env VIEW_COMPILED_PATH): Directory for compiled Blade.
| - cache (env VIEW_CACHE): Toggle compiled view caching.
| - relative_hash, compiled_extension, check_cache_timestamps: Advanced options.
*/

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
    // If true, the hash for compiled views is relative to the views directory.
    // Impacts: cache invalidation when moving project directories.
    'relative_hash' => false,

    // File extension used for compiled blade files.
    // Impacts: file type used in storage/framework/views.
    'compiled_extension' => 'php',

    // If true, checks source view modified time to decide recompilation.
    // Impacts: dev experience vs performance in prod.
    'check_cache_timestamps' => true,

];
