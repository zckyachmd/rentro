<?php

namespace App\Console\Commands;

use App\Enum\ContractStatus;
use App\Jobs\ActivateDueContract;
use App\Models\AppSetting;
use App\Models\Contract;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ContractsActivateDue extends Command
{
    protected $signature = 'contracts:activate-due
        {--chunk=200 : Chunk size for processing contracts}
        {--dry-run : Only show counts without updating}';

    protected $description = 'Queue activation jobs for booked contracts whose start_date has arrived (mark room occupied).';

    public function handle(): int
    {
        $requireCheckin = (bool) AppSetting::config('handover.require_checkin_for_activate', true);
        if ($requireCheckin) {
            $this->info('[skipped] Activation requires check-in; scheduler disabled.');

            return self::SUCCESS;
        }

        $chunkSize = (int) $this->option('chunk');
        $today     = Carbon::now()->startOfDay()->toDateString();
        $queued    = 0;
        $dryRun    = (bool) $this->option('dry-run');

        Contract::query()
            ->select('id')
            ->where('status', ContractStatus::BOOKED->value)
            ->whereDate('start_date', '<=', $today)
            ->orderBy('id')
            ->chunkById($chunkSize, function ($rows) use (&$queued, $today, $dryRun): void {
                $ids = collect($rows)->pluck('id')->all();
                foreach ($ids as $id) {
                    $queued++;
                    if ($dryRun) {
                        continue;
                    }
                    ActivateDueContract::dispatch((int) $id, $today);
                }
            });

        $this->info(($dryRun ? '[dry-run] ' : '') . "Queued activation jobs for {$queued} contract(s).");

        return self::SUCCESS;
    }
}
