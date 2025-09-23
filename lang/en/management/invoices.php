<?php

return [
    'contract_invalid_for_generation' => 'Contract is not valid for invoice generation.',
    'contract_already_paid_in_full'   => 'Contract is already paid in full.',
    'no_missing_months'               => 'No missing months to generate.',
    'generate_backfill_success'       => 'Successfully generated :count missing months.',
    'generate_backfill_failed'        => 'Unable to generate missing months.',
    'period_month_required'           => 'Period month is required for Monthly mode.',
    'period_month_invalid'            => 'Invalid period month format.',
    'period_month_out_of_range'       => 'Selected month is outside the contract period.',
    'generate_failed_generic'         => 'Failed to generate invoice.',
    'created'                         => 'Invoice created successfully.',
    'not_found'                       => 'Invoice not found.',
    'extend' => [
        'only_pending_overdue' => 'Only Pending or Overdue invoices can be extended.',
        'invalid_due_format'   => 'Invalid due date format.',
        'due_must_be_greater'  => 'New due date must be greater than previous due date (:current).',
        'failed'               => 'Failed to extend due date.',
        'not_extendable'       => 'Invoice cannot be extended.',
        'success'              => 'Invoice due date extended.',
    ],
    'cancel' => [
        'already_paid'         => 'Invoice is already paid and cannot be cancelled.',
        'has_completed_payment' => 'Invoice has completed payments and cannot be cancelled.',
        'failed'               => 'Failed to cancel invoice.',
        'success'              => 'Invoice cancelled.',
        'already_cancelled'    => 'Invoice is already in Cancelled status.',
    ],
];
