<?php

namespace App\Jobs;

use App\Models\Contract;
use App\Services\Contracts\ContractServiceInterface;
use App\Services\Contracts\NotificationServiceInterface;
use App\Traits\LogActivity;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CompleteEndedContract implements ShouldQueue
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
        $contract = Contract::query()->with(['room:id,status'])->find($this->contractId);
        if (!$contract) {
            return;
        }

        $contracts->complete($contract);

        $this->logEvent(
            event: 'contract_completed_by_scheduler',
            subject: $contract,
            properties: [
                'end_date' => (string) $contract->end_date,
            ],
            description: 'Contract completed by job as contract ended and not renewed.',
        );

        // Notify tenant
        try {
            $tenantId = (int) ($contract->user_id ?? 0);
            if ($tenantId > 0) {
                $title     = ['key' => 'notifications.content.contract.completed.title'];
                $message   = ['key' => 'notifications.content.contract.completed.message'];
                $actionUrl = route('tenant.contracts.show', ['contract' => $contract->id]);
                $notifications->notifyUser($tenantId, $title, $message, $actionUrl, [
                    'type'        => 'contract',
                    'event'       => 'completed',
                    'contract_id' => (string) $contract->id,
                    'scope'       => config('notifications.controller.default_scope', 'system'),
                ]);
            }
        } catch (\Throwable) {
        }
    }

    public function tags(): array
    {
        return ['contracts', 'contract:' . $this->contractId, 'contract:complete'];
    }
}
