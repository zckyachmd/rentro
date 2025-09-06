<?php

namespace App\Console\Commands;

use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Models\Contract;
use App\Models\Invoice;
use App\Services\Contracts\ContractServiceInterface;
use App\Traits\LogActivity;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ContractsMarkOverdue extends Command
{
    use LogActivity;

    protected $signature = 'contracts:mark-overdue
        {--chunk=200 : Chunk size for processing contracts}
        {--dry-run : Only show counts without dispatching jobs}';

    protected $description = 'Mark contracts OVERDUE when there are invoices past due (Pending/Overdue), and mark past-due Pending invoices to OVERDUE as well (ignoring Cancelled; no Paid invoices present).';

    public function handle(ContractServiceInterface $contracts): int
    {
        $chunkSize = (int) $this->option('chunk');
        $today     = Carbon::now()->startOfDay()->toDateString();
        $count     = 0;
        $dryRun    = (bool) $this->option('dry-run');

        Contract::query()
            ->select('id')
            ->whereIn('status', [
                ContractStatus::PENDING_PAYMENT->value,
                ContractStatus::BOOKED->value,
            ])
            ->where(function ($q) use ($today) {
                $q->whereHas('invoices', function ($iq) use ($today) {
                    $iq->where(function ($w) use ($today) {
                        $w->where('status', InvoiceStatus::PENDING->value)
                            ->where('due_date', '<', $today);
                    })->orWhere('status', InvoiceStatus::OVERDUE->value);
                });
            })
            ->whereDoesntHave('invoices', function ($q) {
                $q->where('status', InvoiceStatus::PAID->value);
            })
            ->orderBy('id')
            ->chunkById($chunkSize, function ($rows) use (&$count, $contracts, $today, $dryRun): void {
                $this->processChunk($rows, $count, $contracts, $today, $dryRun);
            });

        $this->info(($dryRun ? '[dry-run] ' : '') . "Queued mark-overdue jobs for {$count} contract(s).");

        return self::SUCCESS;
    }

    /**
     * Proses satu chunk: tandai invoice PENDING yang lewat jatuh tempo menjadi OVERDUE,
     * lalu tandai kontraknya sebagai OVERDUE (sesuai rule di handle()).
     *
     * @param iterable<int, object> $rows
     * @param int $count
     * @param \App\Services\Contracts\ContractServiceInterface $contracts
     * @param string $today Y-m-d (startOfDay)
     * @param bool $dryRun
     * @return void
     */
    private function processChunk(
        iterable $rows,
        int &$count,
        ContractServiceInterface $contracts,
        string $today,
        bool $dryRun,
    ): void {
        $ids = collect($rows)->pluck('id')->all();
        if (empty($ids)) {
            return;
        }

        $found = Contract::query()
            ->whereIn('id', $ids)
            ->withExists(['invoices as has_payable' => function ($q) {
                $q->whereIn('status', [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value]);
            }])
            ->get()
            ->keyBy('id');

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

            $affected = Invoice::query()
                ->where('contract_id', $contract->id)
                ->where('status', InvoiceStatus::PENDING->value)
                ->where('due_date', '<', $today)
                ->update(['status' => InvoiceStatus::OVERDUE->value]);

            $contracts->markOverdue($contract);

            $hasPayable = (bool) ($contract->getAttribute('has_payable') ?? false);
            $reason     = $hasPayable ? 'pending_or_overdue_invoices' : 'unknown';
            $this->logEvent(
                event: 'contract_marked_overdue_by_scheduler',
                subject: $contract,
                properties: [
                    'reason'           => $reason,
                    'date'             => $today,
                    'invoices_updated' => (int) ($affected ?? 0),
                ],
                description: 'Contract marked OVERDUE by scheduler (and past-due invoices flagged OVERDUE)',
            );
        }
    }
}
