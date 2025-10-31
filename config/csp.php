<?php

return [

    /*
     * A policy will determine which CSP headers will be set. A valid CSP policy is
     * any class that extends `Spatie\Csp\Policies\Policy`
     */
    'policy' => App\Policies\AppCspPolicy::class,

    /*
     * This policy which will be put in report only mode. This is great for testing out
     * a new policy or changes to existing csp policy without breaking anything.
     */
    'report_only_policy' => env('CSP_REPORT_ONLY_POLICY', ''),

    /*
     * All violations against the policy will be reported to this url.
     * A great service you could use for this is https://report-uri.com/
     *
     * You can override this setting by calling `reportTo` on your policy.
     */
    'report_uri' => env('CSP_REPORT_URI', '/csp/report'),

    /*
     * Headers will only be added if this setting is set to true.
     */
    'enabled' => env('CSP_ENABLED', true),

    /*
     * The class responsible for generating the nonces used in inline tags and headers.
     */
    'nonce_generator' => App\Support\Security\LaravelViteNonceGenerator::class,

    /*
     * Set to false to disable automatic nonce generation and handling.
     * This is useful when you want to use 'unsafe-inline' for scripts/styles
     * and cannot add inline nonces.
     * Note that this will make your CSP policy less secure.
     */
    'nonce_enabled' => env('CSP_NONCE_ENABLED', true),

    // Whitelist tambahan (array dari ENV CSV) agar tidak membaca env() di runtime
    // Contoh: CSP_SCRIPT_SRC="https://cdn.example.com, https://app.midtrans.com"
    'whitelist' => [
        'default'         => array_values(array_filter(array_map('trim', explode(',', env('CSP_DEFAULT_SRC', ''))))),
        'script'          => array_values(array_filter(array_map('trim', explode(',', env('CSP_SCRIPT_SRC', ''))))),
        'script_attr'     => array_values(array_filter(array_map('trim', explode(',', env('CSP_SCRIPT_SRC_ATTR', ''))))),
        'script_elem'     => array_values(array_filter(array_map('trim', explode(',', env('CSP_SCRIPT_SRC_ELEM', ''))))),
        'style'           => array_values(array_filter(array_map('trim', explode(',', env('CSP_STYLE_SRC', ''))))),
        'style_attr'      => array_values(array_filter(array_map('trim', explode(',', env('CSP_STYLE_SRC_ATTR', ''))))),
        'style_elem'      => array_values(array_filter(array_map('trim', explode(',', env('CSP_STYLE_SRC_ELEM', ''))))),
        'img'             => array_values(array_filter(array_map('trim', explode(',', env('CSP_IMG_SRC', ''))))),
        'font'            => array_values(array_filter(array_map('trim', explode(',', env('CSP_FONT_SRC', ''))))),
        'connect'         => array_values(array_filter(array_map('trim', explode(',', env('CSP_CONNECT_SRC', ''))))),
        'frame'           => array_values(array_filter(array_map('trim', explode(',', env('CSP_FRAME_SRC', ''))))),
        'frame_ancestors' => array_values(array_filter(array_map('trim', explode(',', env('CSP_FRAME_ANCESTORS', ''))))),
        'object'          => array_values(array_filter(array_map('trim', explode(',', env('CSP_OBJECT_SRC', ''))))),
        'media'           => array_values(array_filter(array_map('trim', explode(',', env('CSP_MEDIA_SRC', ''))))),
        'worker'          => array_values(array_filter(array_map('trim', explode(',', env('CSP_WORKER_SRC', ''))))),
        'manifest'        => array_values(array_filter(array_map('trim', explode(',', env('CSP_MANIFEST_SRC', ''))))),
    ],
];
