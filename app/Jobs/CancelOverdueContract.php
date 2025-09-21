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

class CancelOverdueContract implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;
    use LogActivity;

    public function __construct(
        public int $contractId,
        public string $reason,
        public string $threshold,
        public int $graceDays,
    ) {
        $this->onQueue('contracts');
    }

    public function handle(ContractServiceInterface $contracts): void
    {
        /** @var Contract|null $contract */
        $contract = Contract::query()->find($this->contractId);
        if (!$contract) {
            return;
        }

        $contracts->cancel($contract);

        $this->logEvent(
            event: 'contract_cancelled_by_scheduler',
            subject: $contract,
            properties: [
                'reason'     => $this->reason,
                'threshold'  => $this->threshold,
                'grace_days' => $this->graceDays,
            ],
            description: 'Contract cancelled by job (' . $this->reason . ')',
        );
    }

    public function tags(): array
    {
        return ['contracts', 'contract:' . $this->contractId, 'contract:cancel'];
    }
}
