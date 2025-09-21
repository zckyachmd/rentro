<?php

namespace App\Console\Commands;

use App\Enum\ContractStatus;
use App\Jobs\AutoRenewContract;
use App\Models\AppSetting;
use App\Models\Contract;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ContractsAutoRenewDue extends Command
{
    protected $signature = 'contracts:auto-renew-due
        {--chunk=200 : Chunk size for processing}
        {--dry-run : Only show counts without updating}';

    protected $description = 'Auto-renew contracts by duplicating them into a new contract when due (with deposit rollover and prorata logic).';

    public function handle(): int
    {
        $chunk  = (int) $this->option('chunk');
        $dryRun = (bool) $this->option('dry-run');
        $today  = Carbon::now()->startOfDay();

        $leadDays      = (int) AppSetting::config('contract.auto_renew_lead_days', 7);
        $effectiveLead = max(1, $leadDays);

        $countCreated = 0;
        $countSkipped = 0;

        Contract::query()
            ->select(['id'])
            ->where('auto_renew', true)
            ->where('status', ContractStatus::ACTIVE->value)
            ->whereDate('end_date', '<=', $today->copy()->addDays($effectiveLead)->toDateString())
            ->orderBy('id')
            ->chunkById($chunk, function ($rows) use (&$countCreated, &$countSkipped, $dryRun): void {
                $ids = collect($rows)->pluck('id')->all();
                foreach ($ids as $id) {
                    if ($dryRun) {
                        $countCreated++;
                        continue;
                    }

                    try {
                        AutoRenewContract::dispatch((int) $id);
                        $countCreated++;
                    } catch (\Throwable $e) {
                        $countSkipped++;
                    }
                }
            });

        $prefix = $dryRun ? '[dry-run] ' : '';
        $this->info($prefix . "Auto-renew created={$countCreated}, skipped={$countSkipped}.");

        return self::SUCCESS;
    }
}
