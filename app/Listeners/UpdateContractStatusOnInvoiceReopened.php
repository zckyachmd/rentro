<?php

namespace App\Listeners;

use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Events\InvoiceReopened;
use App\Models\Contract;
use App\Traits\LogActivity;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Middleware\RateLimited;

class UpdateContractStatusOnInvoiceReopened implements ShouldQueue
{
    use LogActivity;
    use Queueable;

    public function __construct()
    {
        $this->onQueue('contracts');
    }

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

        $due   = $invoice->due_date instanceof Carbon ? $invoice->due_date->copy()->startOfDay() : Carbon::parse((string) $invoice->due_date);
        $today = Carbon::now()->startOfDay();

        /** @phpstan-assert Contract $contract */
        $prev = (string) $contract->status->value;
        // Do not change ACTIVE/COMPLETED/CANCELLED contracts when an invoice reopens mid-term
        if (!in_array($prev, [ContractStatus::ACTIVE->value, ContractStatus::COMPLETED->value, ContractStatus::CANCELLED->value], true)) {
            $targetStatus = $due->lessThan($today) ? ContractStatus::OVERDUE : ContractStatus::PENDING_PAYMENT;
            $contract->forceFill(['status' => $targetStatus])->save();

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

        if (!empty($contract->paid_in_full_at)) {
            $hasUnpaid = $contract->invoices()
                ->whereNot('status', InvoiceStatus::CANCELLED->value)
                ->whereNot('status', InvoiceStatus::PAID->value)
                ->exists();
            if ($hasUnpaid) {
                $contract->update(['paid_in_full_at' => null]);
            }
        }
    }

    /**
     * Provide Horizon tags for this queued listener.
     *
     * @return array<int, string>
     */
    public function tags(InvoiceReopened $event): array
    {
        $invoiceId  = (string) ($event->invoice->getAttribute('id') ?? '');
        $contractId = (string) ($event->invoice->getAttribute('contract_id') ?? '');

        return ['contracts', 'listener:invoice_reopened', 'invoice:' . $invoiceId, 'contract:' . $contractId];
    }

    /**
     * Queue middleware for rate limiting.
     *
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [
            new RateLimited('listener:invoice-reopened'),
            new RateLimited('listener:invoice-contract'),
        ];
    }
}
