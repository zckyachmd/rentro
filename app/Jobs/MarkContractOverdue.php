<?php

namespace App\Jobs;

use App\Enum\InvoiceStatus;
use App\Models\Contract;
use App\Models\Invoice;
use App\Services\Contracts\ContractServiceInterface;
use App\Services\Contracts\NotificationServiceInterface;
use App\Traits\LogActivity;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class MarkContractOverdue implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;
    use LogActivity;

    public function __construct(public int $contractId)
    {
        $this->onQueue('contracts');
    }

    public function handle(ContractServiceInterface $contracts, NotificationServiceInterface $notifications): void
    {
        /** @var Contract|null $contract */
        $contract = Contract::query()->find($this->contractId);
        if (!$contract) {
            return;
        }

        $today = now()->startOfDay()->toDateString();

        // Best-effort mark any past-due pending invoices to OVERDUE first (returns affected count)
        $affected = Invoice::query()
            ->where('contract_id', $contract->id)
            ->where('status', InvoiceStatus::PENDING->value)
            ->where('due_date', '<', $today)
            ->update(['status' => InvoiceStatus::OVERDUE->value]);

        // Update contract status accordingly
        $contracts->markOverdue($contract);

        $hasPayable = $contract->invoices()
            ->whereIn('status', [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value])
            ->exists();
        $reason = $hasPayable ? 'pending_or_overdue_invoices' : 'unknown';

        $this->logEvent(
            event: 'contract_marked_overdue_by_scheduler',
            subject: $contract,
            properties: [
                'reason'           => $reason,
                'date'             => $today,
                'invoices_updated' => (int) ($affected ?? 0),
            ],
            description: 'Contract marked OVERDUE by job (and past-due invoices flagged OVERDUE)',
        );

        // Notify tenant that contract is overdue
        try {
            $tenantId = (int) ($contract->user_id ?? 0);
            if ($tenantId > 0) {
                $title     = ['key' => 'notifications.content.contract.overdue.title'];
                $message   = ['key' => 'notifications.content.contract.overdue.message'];
                $actionUrl = route('tenant.contracts.show', ['contract' => $contract->id]);
                $notifications->notifyUser($tenantId, $title, $message, $actionUrl, [
                    'type'        => 'contract',
                    'event'       => 'overdue',
                    'contract_id' => (string) $contract->id,
                    'scope'       => config('notifications.controller.default_scope', 'system'),
                ]);
            }
        } catch (\Throwable) {
        }
    }

    public function tags(): array
    {
        return ['contracts', 'contract:' . $this->contractId, 'contract:overdue'];
    }
}
