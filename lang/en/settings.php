<?php

return [
    'preferences' => [
        'theme' => [
            'required' => 'Theme is required.',
            'in'       => 'Theme must be one of: light, dark, system.',
        ],
        'locale' => [
            'required' => 'Language is required.',
            'in'       => 'Language must be one of: en, id.',
        ],
    ],
];
