<?php

return [
    'address_label' => [
        'home'           => 'Home',
        'office'         => 'Office',
        'campus'         => 'Campus',
        'apartment'      => 'Apartment',
        'boarding_house' => 'Boarding House',
        'parent_house'   => "Parent's House",
        'other'          => 'Other',
    ],

    'emergency_relationship' => [
        'parent'    => 'Parent',
        'sibling'   => 'Sibling',
        'relative'  => 'Relative',
        'spouse'    => 'Spouse',
        'friend'    => 'Close Friend',
        'guardian'  => 'Guardian',
        'roommate'  => 'Roommate',
        'colleague' => 'Colleague',
        'neighbor'  => 'Neighbor',
    ],

    'gender' => [
        'male'   => 'Male',
        'female' => 'Female',
    ],

    'gender_policy' => [
        'any'    => 'Any',
        'male'   => 'Male',
        'female' => 'Female',
    ],

    'document' => [
        'status' => [
            'pending'  => 'Pending',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
        ],
        'type' => [
            'ktp'      => 'ID Card (KTP)',
            'sim'      => 'Driver License (SIM)',
            'passport' => 'Passport',
            'npwp'     => 'Tax ID (NPWP)',
            'other'    => 'Other',
        ],
    ],

    'invoice' => [
        'status' => [
            'pending'   => 'Pending',
            'overdue'   => 'Overdue',
            'paid'      => 'Paid',
            'cancelled' => 'Cancelled',
        ],
    ],

    'payment' => [
        'method' => [
            'cash'            => 'Cash',
            'transfer'        => 'Transfer',
            'virtual_account' => 'Virtual Account',
        ],
        'status' => [
            'review'    => 'Review',
            'pending'   => 'Pending',
            'completed' => 'Completed',
            'failed'    => 'Failed',
            'rejected'  => 'Rejected',
            'cancelled' => 'Cancelled',
        ],
    ],

    'contract' => [
        'status' => [
            'pending_payment' => 'Pending Payment',
            'overdue'         => 'Overdue',
            'cancelled'       => 'Cancelled',
            'booked'          => 'Booked',
            'active'          => 'Active',
            'completed'       => 'Completed',
        ],
    ],

    'room' => [
        'status' => [
            'vacant'      => 'Vacant',
            'reserved'    => 'Reserved',
            'occupied'    => 'Occupied',
            'maintenance' => 'Maintenance',
            'inactive'    => 'Inactive',
        ],
        'type' => [
            'standard' => 'Standard',
            'deluxe'   => 'Deluxe',
            'suite'    => 'Suite',
            'economy'  => 'Economy',
        ],
    ],

    'billing_period' => [
        'daily'   => 'Daily',
        'weekly'  => 'Weekly',
        'monthly' => 'Monthly',
    ],

    'locale' => [
        'en' => 'English',
        'id' => 'Indonesian',
    ],

    'theme' => [
        'light'  => 'Light',
        'dark'   => 'Dark',
        'system' => 'System',
    ],
];
