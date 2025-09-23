<?php

return [
    'roles' => [
        'no_changes' => 'No role changes.',
        'updated'    => 'User roles updated successfully.',
    ],
    'email_missing'         => 'User does not have an email.',
    'reset_link_sent'       => 'Password reset link sent to user email.',
    'reset_link_generated'  => 'Password reset link generated.',
    'reset_mode_invalid'    => 'Invalid mode for reset password link.',
    '2fa' => [
        'disabled' => 'Two-factor authentication has been disabled.',
    ],
    'sessions' => [
        'none'         => 'There are no sessions to delete.',
        'deleted_count' => 'Successfully deleted :count user sessions.',
    ],
    'recovery' => [
        'retrieved'   => 'Recovery codes retrieved successfully.',
        'regenerated' => 'Recovery codes have been regenerated.',
    ],
    'invalid_mode' => 'Invalid mode.',
    'created'      => 'User created successfully.',
    'invite' => [
        'sent'   => 'Invitation email has been sent (contains username, temporary password, and password change link).',
        'failed' => 'WARNING: Invitation email failed to send. You can send it manually from the reset password page.',
    ],
    'verify' => [
        'sent'   => 'Verification email has also been sent.',
        'failed' => 'Verification email not sent. The user can request verification from their profile or you can resend it.',
    ],
];
