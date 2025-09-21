<?php

namespace App\Jobs;

use App\Enum\ContractStatus;
use App\Enum\RoomStatus;
use App\Models\Contract;
use App\Traits\LogActivity;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ActivateDueContract implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;
    use LogActivity;

    public function __construct(public int $contractId, public string $today)
    {
        $this->onQueue('contracts');
    }

    public function handle(): void
    {
        /** @var Contract|null $contract */
        $contract = Contract::query()->with(['room:id,status'])->find($this->contractId);
        if (!$contract) {
            return;
        }

        if ($contract->status->value !== ContractStatus::BOOKED->value) {
            return;
        }

        if ($contract->start_date && $contract->start_date->toDateString() > $this->today) {
            return;
        }

        $contract->forceFill(['status' => ContractStatus::ACTIVE])->save();

        $room = $contract->room;
        if ($room && $room->status->value !== RoomStatus::OCCUPIED->value) {
            $room->update(['status' => RoomStatus::OCCUPIED->value]);
        }

        $this->logEvent(
            event: 'contract_activated_by_scheduler',
            subject: $contract,
            properties: [
                'date' => $this->today,
            ],
            description: 'Contract activated by job as start date has arrived.',
        );
    }

    public function tags(): array
    {
        return ['contracts', 'contract:' . $this->contractId, 'contract:activate'];
    }
}
