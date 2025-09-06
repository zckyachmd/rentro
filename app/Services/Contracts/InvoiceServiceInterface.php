<?php

namespace App\Services\Contracts;

interface InvoiceServiceInterface
{
    /**
     * General-purpose invoice generation entrypoint (new API).
     * Options:
     * - ['month' => 'YYYY-MM'] for a single monthly invoice (Monthly contracts only)
     * - ['full' => true] for a full remaining coverage invoice.
     */
    public function generate(\App\Models\Contract $contract, array $options = []);

    /**
     * Extend due date for a specific invoice.
     * Only allowed for Pending or Overdue invoices.
     * Returns updated invoice on success, or null when not applicable.
     */
    public function extendDue(\App\Models\Invoice $invoice, string $dueDate, ?string $reason = null): ?\App\Models\Invoice;

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
