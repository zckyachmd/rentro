<?php

namespace App\Console\Commands;

use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Services\Contracts\ContractServiceInterface;
use App\Traits\LogActivity;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ContractsCancelOverdue extends Command
{
    use LogActivity;

    protected $signature = 'contracts:cancel-overdue
        {--chunk=200 : Chunk size for processing contracts}
        {--dry-run : Only show counts without dispatching jobs}';

    protected $description = 'Cancel overdue contracts and those past grace period with no payable invoices';

    public function handle(ContractServiceInterface $contracts): int
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
            ->chunkById($chunkSize, function ($rows) use (&$count, $contracts, $threshold, $graceDays, $dryRun): void {
                $this->processChunk($rows, 'contract_overdue_with_overdue_or_cancelled_invoices_or_past_threshold_without_payables', $count, $contracts, $threshold, $graceDays, $dryRun);
            });

        $this->info(($dryRun ? '[dry-run] ' : '') . "Queued cancellation jobs for {$count} contract(s). ");

        return self::SUCCESS;
    }

    /**
     * Proses satu chunk hasil query: batch-fetch contracts untuk hindari N+1, lalu batalkan sesuai reason.
     *
     * @param iterable<int, object> $rows Daftar rows yang minimal punya properti id
     * @param string $reason Alasan pembatalan (untuk audit log)
     * @param int $count (by-ref) penghitung kontrak yang diproses
     * @param \App\Services\Contracts\ContractServiceInterface $contracts Service kontrak
     * @param string $threshold Tanggal ambang (Y-m-d)
     * @param int $graceDays Masa tenggang (hari)
     * @param bool $dryRun Jika true, hanya menghitung tanpa eksekusi
     * @return void
     */
    private function processChunk(
        iterable $rows,
        string $reason,
        int &$count,
        ContractServiceInterface $contracts,
        string $threshold,
        int $graceDays,
        bool $dryRun,
    ): void {
        $ids = collect($rows)->pluck('id')->all();
        if (empty($ids)) {
            return;
        }

        $found = Contract::whereIn('id', $ids)->get()->keyBy('id');

        foreach ($ids as $id) {
            $count++;
            if ($dryRun) {
                continue;
            }
            /** @var Contract|null $contract */
            $contract = $found->get($id);
            if (!$contract) {
                continue;
            }

            $contracts->cancel($contract);

            $this->logEvent(
                event: 'contract_cancelled_by_scheduler',
                subject: $contract,
                properties: [
                    'reason'     => $reason,
                    'threshold'  => $threshold,
                    'grace_days' => $graceDays,
                ],
                description: 'Contract cancelled by scheduler (' . $reason . ')',
            );
        }
    }
}
