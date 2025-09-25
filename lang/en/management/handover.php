<?php

return [
    'checkin_created'  => 'Check-in created successfully.',
    'checkout_created' => 'Check-out created successfully.',
    'errors' => [
        'invalid_for_checkin'     => 'Contract is not valid for check-in.',
        'start_date_not_reached'  => 'Contract start date has not arrived.',
        'pending_checkin_exists'  => 'There is a check-in pending tenant confirmation.',
        'invalid_for_checkout'    => 'Contract is not valid for check-out.',
        'no_confirmed_checkin'    => 'No confirmed check-in yet. Repeat check-in and ensure tenant approval.',
        'checkout_already_exists' => 'Check-out has already been created.',
    ],
    'attributes' => [
        'notes'       => 'notes',
        'attachments' => 'attachments',
    ],
    'validation' => [
        'files' => [
            'general' => [
                'required' => 'Please upload photos as evidence.',
                'min'      => 'Please upload at least :min photo(s) as evidence.',
            ],
        ],
    ],
];
