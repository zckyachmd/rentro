<?php

namespace App\Services\Contracts;

use App\Models\Contract;
use App\Models\Invoice;

interface ContractServiceInterface
{
    /**
     * Create a contract, generate initial invoice(s), and optionally mark as paid
     * depending on input flags. Implementations must:
     * - validate duration & allowed terms against settings,
     * - compute end date & billing day (respecting prorata settings),
     * - create the first invoice(s) following the chosen payment plan.
     *
     * @param array<string,mixed> $data Validated payload from controller/form
     * @return Contract
     */
    public function create(array $data): Contract;

    /**
     * Mark a contract as OVERDUE when there is at least one pending invoice whose due_date has passed
     * and no invoice has been fully paid yet. Idempotent and guarded by checks.
     */
    public function markOverdue(Contract $contract): void;

    /**
     * Extend the due date of the latest pending/overdue invoice on a contract.
     * Returns the updated invoice, or null when none found.
     */
    public function extendDue(Contract $contract, string $dueDate): ?Invoice;

    /**
     * Cancel a contract: set status to Cancelled, stop auto-renew,
     * cancel unpaid invoices/payments, and free the room.
     * Notes:
     * - Contracts with any fully paid invoice are not cancellable here.
     * - Invoices that already have any completed payments (e.g., deposit) are left as-is
     *   for payment/refund handling by the payment workflow.
     */
    public function cancel(Contract $contract): void;

    /**
     * Set auto-renew state on a contract.
     */
    public function setAutoRenew(Contract $contract, bool $enabled): void;
}
