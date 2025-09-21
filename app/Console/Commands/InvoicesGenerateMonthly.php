<?php

namespace App\Console\Commands;

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use App\Jobs\GenerateMonthlyInvoicesForContract;
use App\Models\AppSetting;
use App\Models\Contract;
use Carbon\Carbon;
use Illuminate\Console\Command;

class InvoicesGenerateMonthly extends Command
{
    protected $signature = 'invoices:generate-monthly
        {--month= : Target month in YYYY-MM (defaults to current month; bypasses release-day check)}
        {--chunk=200 : Chunk size for processing}
        {--dry-run : Only display counts, do not create invoices}';

    protected $description = 'Queue monthly invoice generation jobs for active contracts (aligned with AppSettings and sequential month rules).';

    public function handle(): int
    {
        $chunkSize = (int) $this->option('chunk');
        $dryRun    = (bool) $this->option('dry-run');
        $verbose   = $this->getOutput()->isVerbose();

        $now         = Carbon::now();
        $override    = $this->option('month');
        $hasOverride = is_string($override) && $override !== '';
        $targetInfo  = $this->parseTargetMonth($override);
        if ($targetInfo === null) {
            $this->error('Invalid --month format. Expected YYYY-MM.');

            return self::INVALID;
        }
        $target     = $targetInfo['target'];
        $monthStart = $targetInfo['start'];
        $monthEnd   = $targetInfo['end'];
        $releaseDom = (int) AppSetting::config('billing.release_day_of_month', 1);
        $prorata    = (bool) AppSetting::config('billing.prorata', false);

        $queued  = 0;
        $skipped = 0;

        Contract::query()
            ->select(['id'])
            ->where('billing_period', BillingPeriod::MONTHLY->value)
            ->whereNotIn('status', [ContractStatus::CANCELLED->value, ContractStatus::COMPLETED->value])
            // Contracts overlapping target month
            ->whereDate('start_date', '<=', $monthEnd->toDateString())
            ->whereDate('end_date', '>=', $monthStart->toDateString())
            ->orderBy('id')
            ->chunkById($chunkSize, function ($rows) use (&$queued, &$skipped, $dryRun, $verbose, $target, $now, $releaseDom, $prorata, $hasOverride): void {
                $ids = collect($rows)->pluck('id')->all();
                if (empty($ids)) {
                    return;
                }

                /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Contract> $contracts */
                $contracts = Contract::query()
                    ->whereIn('id', $ids)
                    ->get(['id', 'billing_day', 'billing_period', 'status', 'start_date', 'end_date']);

                foreach ($contracts as $contract) {
                    if (!$hasOverride && !$this->shouldProcessToday($contract, $now, $releaseDom, $prorata, $verbose)) {
                        $skipped++;
                        continue;
                    }
                    if ($dryRun) {
                        $queued++;
                        if ($verbose) {
                            $this->line("- Contract #{$contract->id}: would queue monthly invoice job for {$target}");
                        }
                        continue;
                    }
                    GenerateMonthlyInvoicesForContract::dispatch($contract->id, $target);
                    $queued++;
                    if ($verbose) {
                        $this->line("- Contract #{$contract->id}: queued monthly invoice job for {$target}");
                    }
                }
            });

        $prefix = $dryRun ? '[dry-run] ' : '';
        $this->info($prefix . "Target month {$target}; queued={$queued}, skipped={$skipped}.");

        return self::SUCCESS;
    }

    /**
     * Parse target month option to Carbon start/end and normalized string.
     * @return array{start:Carbon,end:Carbon,target:string}|null
     */
    private function parseTargetMonth($override): ?array
    {
        $now    = Carbon::now();
        $target = is_string($override) && $override !== '' ? (string) $override : $now->format('Y-m');
        try {
            $start = Carbon::createFromFormat('Y-m', $target)->startOfMonth();
        } catch (\Throwable $e) {
            return null;
        }

        return [
            'start'  => $start,
            'end'    => $start->copy()->endOfMonth(),
            'target' => $target,
        ];
    }

    /**
     * Decide whether to process this contract today based on billing_day or releaseDom.
     */
    private function shouldProcessToday(Contract $contract, Carbon $now, int $releaseDom, bool $prorata, bool $verbose): bool
    {
        $anchorDom = (int) ($prorata ? $releaseDom : ($contract->billing_day ?? $releaseDom));
        $anchorDom = max(1, min(31, $anchorDom));
        if ((int) $now->day !== $anchorDom) {
            if ($verbose) {
                $this->line("- Contract #{$contract->id}: skipped (today DOM {$now->day} != billing_day {$anchorDom})");
            }

            return false;
        }

        return true;
    }
}
