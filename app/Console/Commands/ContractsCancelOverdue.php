<?php

namespace App\Console\Commands;

use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Services\Contracts\ContractServiceInterface;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ContractsCancelOverdue extends Command
{
    protected $signature = 'contracts:cancel-overdue
        {--chunk=200 : Chunk size for processing contracts}
        {--dry-run : Only show counts without dispatching jobs}';

    protected $description = 'Scan contracts with overdue invoices and dispatch cancellation jobs for eligible ones';

    public function handle(ContractServiceInterface $contracts): int
    {
        $chunkSize = (int) $this->option('chunk');
        $graceDays = (int) AppSetting::config('contract.grace_days', 7);
        $threshold = Carbon::now()->startOfDay()->subDays(max(0, $graceDays))->toDateString();
        $count     = 0;

        Contract::query()
            ->select('id')
            ->where('status', ContractStatus::OVERDUE->value)
            ->whereHas('invoices', function ($q) use ($threshold) {
                $q->where('status', InvoiceStatus::OVERDUE->value)
                    ->where('due_date', '<=', $threshold);
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
                            $contracts->cancel($contract);
                        }
                    }
                }
            });

        $this->info(($this->option('dry-run') ? '[dry-run] ' : '') . "Queued cancellation jobs for {$count} contract(s). ");

        return self::SUCCESS;
    }
}
