<?php

return [
    /*
    |--------------------------------------------------------------------------
    | TOTP Verification Window (steps)
    |--------------------------------------------------------------------------
    | Number of steps (30s intervals by default) tolerated during OTP verification.
    | This defines how much time drift between server and client devices is accepted.
    | Example: 8 ≈ ±4 minutes both ways.
    */
    'window' => env('TOTP_WINDOW', 8),

    /*
    |--------------------------------------------------------------------------
    | TOTP Period (seconds)
    |--------------------------------------------------------------------------
    | Lifetime of one OTP code in seconds. Common value is 30s.
    | Increasing makes codes last longer (more convenient, less secure),
    | decreasing makes them expire faster.
    */
    'period' => env('TOTP_PERIOD', 30),

    /*
    |--------------------------------------------------------------------------
    | TOTP Digits (length)
    |--------------------------------------------------------------------------
    | Length of the OTP code in digits. Common values: 6 or 8.
    | Longer codes are harder to guess but less convenient.
    */
    'digits' => env('TOTP_DIGITS', 6),

    /*
    |--------------------------------------------------------------------------
    | TOTP Algorithm
    |--------------------------------------------------------------------------
    | Hash algorithm used for TOTP. Widely supported: SHA1 (most compatible).
    | Some apps also support SHA256/SHA512. Check your authenticator app support.
    */
    'algorithm' => env('TOTP_ALGO', 'SHA1'),

    /*
    |--------------------------------------------------------------------------
    | QR Code Size (pixels)
    |--------------------------------------------------------------------------
    | Side size (px) for the rendered QR code SVG. Affects only display, not security.
    */
    'qr_size' => env('TOTP_QR_SIZE', 240),

    /*
    |--------------------------------------------------------------------------
    | Issuer (label)
    |--------------------------------------------------------------------------
    | Issuer name displayed in the authenticator app. Preferably set to your app or brand name.
    */

    'issuer' => env('TOTP_ISSUER', env('APP_NAME', 'Rentro')),

    /*
    |--------------------------------------------------------------------------
    | 2FA Session Expiration (minutes)
    |--------------------------------------------------------------------------
    | How long (in minutes) the 2FA pending login session remains valid before expiring.
    | After expiration, the user must re-login to initiate 2FA again.
    */
    'session_expire' => env('TWOFACTOR_SESSION_EXPIRE', 10),
];
