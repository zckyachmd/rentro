<?php

namespace App\Listeners;

use App\Enum\ContractStatus;
use App\Events\InvoicePaid;
use App\Models\Contract;
use App\Models\Invoice;
use App\Traits\LogActivity;

class UpdateContractStatusOnInvoicePaid
{
    use LogActivity;

    public function handle(InvoicePaid $event): void
    {
        /** @var Invoice $invoice */
        $invoice  = $event->invoice->fresh(['contract']);
        $contract = $invoice->contract;
        /** @var Contract|null $contract */
        if (!$contract) {
            return;
        }
        /** @phpstan-assert Contract $contract */

        // Transition contract status when a related invoice is paid
        $current = (string) $contract->status->value; // keep logic; PHPStan now knows $contract is Contract
        if (
            in_array($current, [
            ContractStatus::PENDING_PAYMENT->value,
            ContractStatus::BOOKED->value,
            ContractStatus::OVERDUE->value,
            ], true)
        ) {
            $contract->forceFill(['status' => ContractStatus::PAID])->save();

            // Log activity for audit
            $this->logEvent(
                event: 'contract_status_changed',
                subject: $contract,
                properties: [
                    'contract_id' => (string) $contract->getAttribute('id'),
                    'invoice_id'  => (string) $invoice->getAttribute('id'),
                    'from'        => $current,
                    'to'          => ContractStatus::PAID->value,
                    'cause'       => 'invoice_paid',
                ],
                logName: 'billing',
            );
        }
    }
}
