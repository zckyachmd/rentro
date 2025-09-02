<?php

namespace App\Services\Contracts;

use App\Models\Contract;
use Illuminate\Support\Collection;

interface InvoiceServiceInterface
{
    /**
     * Create initial invoices for a freshly created contract.
     * Returns a collection of Invoice models (persisted).
     *
     * @param Contract $contract
     * @param array $data Validated request data (rent_cents, deposit_cents, billing_period, duration_count, monthly_payment_mode)
     * @return Collection<int, \App\Models\Invoice>
     */
    public function createInitialInvoices(Contract $contract, array $data): Collection;

    /**
     * Generate the next invoice for a contract starting from the day after the last invoice period_end
     * (or contract start if no invoices), using the provided mode.
     *
     * @param Contract $contract
     * @param string $mode 'per_month' | 'full'
     * @return \App\Models\Invoice
     */
    public function generateNextInvoice(Contract $contract, string $mode, string $target = 'next');

    /**
     * Cancel a single invoice.
     * Note: validation should be performed by the caller (controller).
     * This method will idempotently set status to Cancelled and cancel
     * any pending payments associated with the invoice.
     *
     * @param \App\Models\Invoice $invoice
     * @param string|null $reason Optional reason for audit trail
     * @return bool True if state changed to Cancelled, false if already Cancelled
     */
    public function cancel(\App\Models\Invoice $invoice, ?string $reason = null): bool;
}
