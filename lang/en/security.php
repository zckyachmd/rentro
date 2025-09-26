<?php

return [
    'password_updated' => 'Password updated successfully.',
    'sessions' => [
        'revoked_others'        => 'Logged out from all other sessions successfully.',
        'not_found_or_not_owned' => 'Session not found or not owned by you.',
        'cannot_logout_current' => 'You cannot log out the current session here.',
    ],
    'session' => [
        'logged_out' => 'Session has been logged out.',
    ],
    '2fa' => [
        'prepare_started' => '2FA setup started. Scan QR & confirm OTP.',
        'not_initiated'   => '2FA has not been initiated.',
        'invalid_code'    => 'Invalid or expired OTP code.',
        'confirmed'       => '2FA confirmed successfully.',
        'none_to_cancel'  => 'There is no 2FA process to cancel.',
        'cancelled'       => '2FA process cancelled.',
        'disabled'        => '2FA disabled.',
        'recovery'        => [
            'needs_enabled' => 'Enable & confirm 2FA first.',
            'updated'       => 'Recovery codes updated.',
        ],
    ],
];
