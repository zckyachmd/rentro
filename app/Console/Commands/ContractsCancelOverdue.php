<?php

namespace App\Console\Commands;

use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Jobs\CancelOverdueContract;
use App\Models\AppSetting;
use App\Models\Contract;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ContractsCancelOverdue extends Command
{
    protected $signature = 'contracts:cancel-overdue
        {--chunk=200 : Chunk size for processing contracts}
        {--dry-run : Only show counts without dispatching jobs}';

    protected $description = 'Cancel overdue contracts and those past grace period with no payable invoices';

    public function handle(): int
    {
        $chunkSize = (int) $this->option('chunk');
        $graceDays = (int) AppSetting::config('contract.grace_days', 7);
        $threshold = Carbon::now()->startOfDay()->subDays(max(0, $graceDays))->toDateString();
        $count     = 0;

        $dryRun = (bool) $this->option('dry-run');

        Contract::query()
            ->select('contracts.id')
            ->where('contracts.status', ContractStatus::OVERDUE->value)
            ->where(function ($q) use ($threshold) {
                $q->whereHas('invoices', function ($iq) {
                    $iq->whereIn('status', [
                        InvoiceStatus::OVERDUE->value,
                        InvoiceStatus::CANCELLED->value,
                    ]);
                })
                    ->orWhere(function ($w) use ($threshold) {
                        $w->whereDate('contracts.start_date', '<=', $threshold)
                            ->whereDoesntHave('invoices', function ($iq) {
                                $iq->whereIn('status', [
                                    InvoiceStatus::PENDING->value,
                                    InvoiceStatus::OVERDUE->value,
                                ]);
                            });
                    });
            })
            ->distinct()
            ->orderBy('contracts.id')
            ->chunkById($chunkSize, function ($rows) use (&$count, $threshold, $graceDays, $dryRun): void {
                $reason = 'contract_overdue_with_overdue_or_cancelled_invoices_or_past_threshold_without_payables';
                $ids    = collect($rows)->pluck('id')->all();
                foreach ($ids as $id) {
                    $count++;
                    if ($dryRun) {
                        continue;
                    }
                    CancelOverdueContract::dispatch((int) $id, $reason, $threshold, $graceDays);
                }
            });

        $this->info(($dryRun ? '[dry-run] ' : '') . "Queued cancellation jobs for {$count} contract(s). ");

        return self::SUCCESS;
    }
}
