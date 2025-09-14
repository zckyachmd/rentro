<?php

namespace App\Console\Commands;

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Services\Contracts\ContractServiceInterface;
use App\Services\Contracts\InvoiceServiceInterface;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class InvoicesGenerateMonthly extends Command
{
    protected $signature = 'invoices:generate-monthly
        {--month= : Target month in YYYY-MM (defaults to current month; bypasses release-day check)}
        {--chunk=200 : Chunk size for processing}
        {--dry-run : Only display counts, do not create invoices}';

    protected $description = 'Generate monthly invoices for active contracts, aligned with AppSettings and sequential month rules.';

    public function handle(InvoiceServiceInterface $invoices, ContractServiceInterface $contractsSvc): int
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

        $count   = 0;
        $skipped = 0;
        $failed  = 0;

        Contract::query()
            ->select(['id'])
            ->where('billing_period', BillingPeriod::MONTHLY->value)
            ->whereNotIn('status', [ContractStatus::CANCELLED->value, ContractStatus::COMPLETED->value])
            // Contracts overlapping target month
            ->whereDate('start_date', '<=', $monthEnd->toDateString())
            ->whereDate('end_date', '>=', $monthStart->toDateString())
            ->orderBy('id')
            ->chunkById($chunkSize, function ($rows) use (&$count, &$skipped, &$failed, $invoices, $contractsSvc, $dryRun, $verbose, $target, $now, $releaseDom, $prorata, $hasOverride): void {
                $ids = collect($rows)->pluck('id')->all();
                if (empty($ids)) {
                    return;
                }

                /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Contract> $contracts */
                $contracts = Contract::query()
                    ->whereIn('id', $ids)
                    ->with(['room:id,price_cents'])
                    ->withCount('invoices')
                    ->get();

                foreach ($contracts as $contract) {
                    if (!$hasOverride && !$this->shouldProcessToday($contract, $now, $releaseDom, $prorata, $verbose)) {
                        $skipped++;
                        continue;
                    }
                    [$c, $s, $f] = $this->processContract($contract, $target, $dryRun, $verbose, $invoices, $contractsSvc);
                    $count += $c;
                    $skipped += $s;
                    $failed += $f;
                }
            });

        $prefix = $dryRun ? '[dry-run] ' : '';
        $this->info($prefix . "Target month {$target}; created={$count}, skipped={$skipped}, failed={$failed}.");

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

    /**
     * Process a single contract for the target month, handling first or sequential invoices.
     * @return array{int,int,int} [created, skipped, failed]
     */
    private function processContract(Contract $contract, string $target, bool $dryRun, bool $verbose, InvoiceServiceInterface $invoices, ContractServiceInterface $contractsSvc): array
    {
        $created = 0;
        $skipped = 0;
        $failed  = 0;
        try {
            if ((int) ($contract->getAttribute('invoices_count') ?? 0) === 0) {
                if (!empty($contract->paid_in_full_at)) {
                    $skipped++;
                    if ($verbose) {
                        $this->line("- Contract #{$contract->id}: skipped (paid in full)");
                    }

                    return [$created, $skipped, $failed];
                }
                if ($dryRun) {
                    $created++;
                    if ($verbose) {
                        $this->line("- Contract #{$contract->id}: would create initial invoice");
                    }

                    return [$created, $skipped, $failed];
                }
                $contractsSvc->generateInitialInvoice($contract);
                if ($verbose) {
                    $this->line("- Contract #{$contract->id}: created initial invoice");
                }
                $created++;

                return [$created, $skipped, $failed];
            }

            /** @var \App\Models\Invoice|null $latest */
            $latest = $contract->invoices()
                ->where('status', '!=', \App\Enum\InvoiceStatus::CANCELLED)
                ->orderByDesc('period_end')
                ->first(['id', 'period_end']);

            $contractStart = Carbon::parse($contract->start_date)->startOfDay();
            $contractEnd   = Carbon::parse($contract->end_date)->startOfDay();
            $targetStart   = Carbon::createFromFormat('Y-m', $target)->startOfMonth();

            $expectedStart = ($latest && $latest->getAttribute('period_end'))
                ? Carbon::parse((string) $latest->getAttribute('period_end'))->addDay()->startOfMonth()
                : $contractStart->copy()->startOfMonth();

            while ($expectedStart->lessThanOrEqualTo($targetStart) && $expectedStart->lessThanOrEqualTo($contractEnd)) {
                if ($this->hasDuplicateForMonth($contract, $expectedStart)) {
                    $skipped++;
                    if ($verbose) {
                        $ym = $expectedStart->format('Y-m');
                        $this->line("- Contract #{$contract->id}: skipped ({$ym} already has invoice)");
                    }
                    $expectedStart = $expectedStart->copy()->addMonthNoOverflow()->startOfMonth();
                    continue;
                }

                if ($dryRun) {
                    $created++;
                    if ($verbose) {
                        $ym = $expectedStart->format('Y-m');
                        $this->line("- Contract #{$contract->id}: would create monthly invoice for {$ym}");
                    }
                } else {
                    $invoices->generate($contract, ['month' => $expectedStart->format('Y-m')]);
                    if ($verbose) {
                        $ym = $expectedStart->format('Y-m');
                        $this->line("- Contract #{$contract->id}: created monthly invoice for {$ym}");
                    }
                    $created++;
                }
                $expectedStart = $expectedStart->copy()->addMonthNoOverflow()->startOfMonth();
            }
        } catch (\Throwable $e) {
            $result = $this->classifyException($e, $contract, $verbose);
            if ($result === 'skip') {
                $skipped++;
            } else {
                $failed++;
            }
        }

        return [$created, $skipped, $failed];
    }

    private function hasDuplicateForMonth(Contract $contract, Carbon $monthStart): bool
    {
        $start = $monthStart->copy();
        $end   = $start->copy()->endOfMonth();

        return $contract->invoices()
            ->where('status', '!=', \App\Enum\InvoiceStatus::CANCELLED)
            ->whereDate('period_start', '<=', $end->toDateString())
            ->whereDate('period_end', '>=', $start->toDateString())
            ->exists();
    }

    private function classifyException(\Throwable $e, Contract $contract, bool $verbose): string
    {
        $msg          = (string) $e->getMessage();
        $lower        = strtolower($msg);
        $isSequential = str_contains($lower, 'berurutan') || str_contains($lower, 'urutan') || str_contains($lower, 'sudah ada invoice');
        $isPaidFull   = str_contains($lower, 'sudah lunas');
        $isOutOfRange = str_contains($lower, 'di luar masa kontrak');
        if ($isSequential || $isPaidFull || $isOutOfRange) {
            if ($verbose) {
                $this->line("- Contract #{$contract->id}: skipped ({$msg})");
            }

            return 'skip';
        }
        Log::warning('Failed generating monthly invoice', [
            'contract_id' => (string) $contract->id,
            'error'       => $msg,
        ]);
        if ($verbose) {
            $this->line("- Contract #{$contract->id}: failed ({$msg})");
        }

        return 'fail';
    }
}
