<?php

namespace App\Console\Commands;

use App\Enum\ContractStatus;
use App\Jobs\CompleteEndedContract;
use App\Models\AppSetting;
use App\Models\Contract;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ContractsCompleteEnded extends Command
{
    protected $signature = 'contracts:complete-ended
        {--chunk=200 : Chunk size for processing}
        {--dry-run : Only show counts without updating}';

    protected $description = 'Mark ended, non-renewing contracts as COMPLETED and free rooms (regardless of unpaid invoices).';

    public function handle(): int
    {
        $requireCheckout  = (bool) AppSetting::config('handover.require_checkout_for_complete', true);
        $requireTenantAck = (bool) AppSetting::config('handover.require_tenant_ack_for_complete', false);
        if ($requireCheckout || $requireTenantAck) {
            $this->info('[skipped] Completion menunggu proses checkout/konfirmasi tenant; scheduler dinonaktifkan.');

            return self::SUCCESS;
        }

        $chunk   = (int) $this->option('chunk');
        $dryRun  = (bool) $this->option('dry-run');
        $today   = Carbon::now()->startOfDay()->toDateString();
        $count   = 0;
        $skipped = 0;

        Contract::query()
            ->select(['id'])
            ->whereDate('end_date', '<', $today)
            ->whereNotIn('status', [
                ContractStatus::CANCELLED->value,
                ContractStatus::COMPLETED->value,
            ])
            ->where(function ($q) {
                $q->where('auto_renew', false)
                    ->orWhereNotNull('renewal_cancelled_at');
            })
            ->orderBy('id')
            ->chunkById($chunk, function ($rows) use (&$count, &$skipped, $dryRun): void {
                $ids = collect($rows)->pluck('id')->all();
                if (empty($ids)) {
                    return;
                }

                foreach ($ids as $id) {
                    if ($dryRun) {
                        $count++;
                        continue;
                    }
                    try {
                        CompleteEndedContract::dispatch((int) $id);
                        $count++;
                    } catch (\Throwable $e) {
                        $skipped++;
                    }
                }
            });

        $prefix = $dryRun ? '[dry-run] ' : '';
        $this->info($prefix . "Completed {$count} contract(s); skipped={$skipped}.");

        return self::SUCCESS;
    }
}
