<?php

namespace App\Console\Commands;

use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Jobs\MarkContractOverdue;
use App\Models\Contract;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ContractsMarkOverdue extends Command
{
    protected $signature = 'contracts:mark-overdue
        {--chunk=200 : Chunk size for processing contracts}
        {--dry-run : Only show counts without dispatching jobs}';

    protected $description = 'Mark contracts OVERDUE when there are invoices past due (Pending/Overdue), and mark past-due Pending invoices to OVERDUE as well (ignoring Cancelled; no Paid invoices present).';

    public function handle(): int
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
            ->chunkById($chunkSize, function ($rows) use (&$count, $dryRun): void {
                $ids = collect($rows)->pluck('id')->all();
                foreach ($ids as $id) {
                    $count++;
                    if ($dryRun) {
                        continue;
                    }
                    MarkContractOverdue::dispatch((int) $id);
                }
            });

        $this->info(($dryRun ? '[dry-run] ' : '') . "Queued mark-overdue jobs for {$count} contract(s).");

        return self::SUCCESS;
    }
}
