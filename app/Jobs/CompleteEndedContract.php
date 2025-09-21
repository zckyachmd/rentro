<?php

namespace App\Jobs;

use App\Models\Contract;
use App\Services\Contracts\ContractServiceInterface;
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

    public function handle(ContractServiceInterface $contracts): void
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
    }

    public function tags(): array
    {
        return ['contracts', 'contract:' . $this->contractId, 'contract:complete'];
    }
}
