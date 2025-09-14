<?php

namespace App\Console\Commands;

use App\Enum\ContractStatus;
use App\Enum\RoomStatus;
use App\Models\Contract;
use App\Traits\LogActivity;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ContractsActivateDue extends Command
{
    use LogActivity;

    protected $signature = 'contracts:activate-due
        {--chunk=200 : Chunk size for processing contracts}
        {--dry-run : Only show counts without updating}';

    protected $description = 'Activate contracts with status PAID whose start_date has arrived; mark related room as OCCUPIED.';

    public function handle(): int
    {
        $chunkSize = (int) $this->option('chunk');
        $today     = Carbon::now()->startOfDay()->toDateString();
        $count     = 0;
        $dryRun    = (bool) $this->option('dry-run');

        Contract::query()
            ->select('id')
            ->where('status', ContractStatus::PAID->value)
            ->whereDate('start_date', '<=', $today)
            ->orderBy('id')
            ->chunkById($chunkSize, function ($rows) use (&$count, $today, $dryRun): void {
                $this->processChunk($rows, $count, $today, $dryRun);
            });

        $this->info(($dryRun ? '[dry-run] ' : '') . "Activated {$count} contract(s) due to start.");

        return self::SUCCESS;
    }

    /**
     * @param iterable<int, object> $rows
     */
    private function processChunk(iterable $rows, int &$count, string $today, bool $dryRun): void
    {
        $ids = collect($rows)->pluck('id')->all();
        if (empty($ids)) {
            return;
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Contract> $contracts */
        $contracts = Contract::query()
            ->whereIn('id', $ids)
            ->with(['room:id,status'])
            ->get();

        foreach ($contracts as $contract) {
            $count++;
            if ($dryRun) {
                continue;
            }

            $contract->forceFill(['status' => ContractStatus::ACTIVE])->save();

            /** @var \App\Models\Room|null $room */
            $room = $contract->room;
            if ($room && $room->status->value !== RoomStatus::OCCUPIED->value) {
                $room->update(['status' => RoomStatus::OCCUPIED->value]);
            }

            $this->logEvent(
                event: 'contract_activated_by_scheduler',
                subject: $contract,
                properties: [
                    'date' => $today,
                ],
                description: 'Contract activated by scheduler as start date has arrived.',
            );
        }
    }
}
