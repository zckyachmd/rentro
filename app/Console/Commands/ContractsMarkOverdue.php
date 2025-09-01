<?php

namespace App\Console\Commands;

use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Models\Contract;
use App\Services\Contracts\ContractServiceInterface;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ContractsMarkOverdue extends Command
{
    protected $signature = 'contracts:mark-overdue
        {--chunk=200 : Chunk size for processing contracts}
        {--dry-run : Only show counts without dispatching jobs}';

    protected $description = 'Mark contracts as OVERDUE when they have overdue pending invoices and no paid invoices.';

    public function handle(ContractServiceInterface $contracts): int
    {
        $chunkSize = (int) $this->option('chunk');
        $today     = Carbon::now()->startOfDay()->toDateString();
        $count     = 0;

        Contract::query()
            ->select('id')
            ->whereIn('status', [
                ContractStatus::PENDING_PAYMENT->value,
                ContractStatus::BOOKED->value,
            ])
            ->whereHas('invoices', function ($q) use ($today) {
                $q->where('status', InvoiceStatus::PENDING->value)
                    ->where('due_date', '<', $today);
            })
            ->whereDoesntHave('invoices', function ($q) {
                $q->where('status', InvoiceStatus::PAID->value);
            })
            ->orderBy('id')
            ->chunkById($chunkSize, function ($rows) use (&$count, $contracts): void {
                foreach ($rows as $row) {
                    $count++;
                    if (!$this->option('dry-run')) {
                        $contract = Contract::find($row->id);
                        if ($contract) {
                            $contracts->markOverdue($contract);
                        }
                    }
                }
            });

        $this->info(($this->option('dry-run') ? '[dry-run] ' : '') . "Queued mark-overdue jobs for {$count} contract(s).");

        return self::SUCCESS;
    }
}
