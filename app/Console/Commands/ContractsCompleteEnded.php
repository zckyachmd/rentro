<?php

namespace App\Console\Commands;

use App\Enum\ContractStatus;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Services\Contracts\ContractServiceInterface;
use App\Traits\LogActivity;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ContractsCompleteEnded extends Command
{
    use LogActivity;

    protected $signature = 'contracts:complete-ended
        {--chunk=200 : Chunk size for processing}
        {--dry-run : Only show counts without updating}';

    protected $description = 'Mark ended, non-renewing contracts as COMPLETED and free rooms (regardless of unpaid invoices).';

    public function handle(ContractServiceInterface $contracts): int
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
            ->chunkById($chunk, function ($rows) use (&$count, &$skipped, $contracts, $dryRun): void {
                $ids = collect($rows)->pluck('id')->all();
                if (empty($ids)) {
                    return;
                }

                $batch = Contract::query()
                    ->whereIn('id', $ids)
                    ->with(['room:id,status'])
                    ->get();

                foreach ($batch as $c) {
                    if ($dryRun) {
                        $count++;
                        continue;
                    }

                    try {
                        $contracts->complete($c);
                        $count++;

                        $this->logEvent(
                            event: 'contract_completed_by_scheduler',
                            subject: $c,
                            properties: [
                                'end_date' => (string) $c->end_date,
                            ],
                            description: 'Contract completed by scheduler as contract ended and not renewed.',
                        );
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
