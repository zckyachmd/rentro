<?php

namespace App\Listeners;

use App\Enum\ContractStatus;
use App\Events\InvoiceReopened;
use App\Models\Contract;
use App\Models\Invoice;
use App\Traits\LogActivity;
use Carbon\Carbon;

class UpdateContractStatusOnInvoiceReopened
{
    use LogActivity;

    /**
     * Handle the InvoiceReopened event.
     */
    public function handle(InvoiceReopened $event): void
    {
        $invoice  = $event->invoice->fresh(['contract']); // @phpstan-ignore-line
        $contract = $invoice->contract;
        /** @var Contract|null $contract */
        if (!$contract) {
            return;
        }

        // If invoice reopened (now Pending/Overdue), reflect it on contract
        $due          = $invoice->due_date instanceof Carbon ? $invoice->due_date->copy()->startOfDay() : Carbon::parse((string) $invoice->due_date);
        $today        = Carbon::now()->startOfDay();
        $targetStatus = $due->lessThan($today) ? ContractStatus::OVERDUE : ContractStatus::PENDING_PAYMENT;

        // Only downgrade when appropriate (do not alter Cancelled/Completed)
        /** @phpstan-assert Contract $contract */
        $prev = (string) $contract->status->value;
        if (!in_array($prev, [ContractStatus::CANCELLED->value, ContractStatus::COMPLETED->value], true)) {
            $contract->forceFill(['status' => $targetStatus])->save();

            // Log activity for audit
            $this->logEvent(
                event: 'contract_status_changed',
                subject: $contract,
                properties: [
                    'contract_id' => (string) $contract->getAttribute('id'),
                    'invoice_id'  => (string) $invoice->getAttribute('id'),
                    'from'        => $prev,
                    'to'          => $targetStatus->value,
                    'cause'       => 'invoice_reopened',
                ],
                logName: 'billing',
            );
        }
    }
}
