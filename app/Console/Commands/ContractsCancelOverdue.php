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

        // Case 1: Contracts already OVERDUE with overdue invoices past threshold and no paid invoices
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
            ->chunkById($chunkSize, function ($rows) use (&$count, $contracts, $threshold): void {
                foreach ($rows as $row) {
                    $count++;
                    if (!$this->option('dry-run')) {
                        $contract = Contract::find($row->id);
                        if ($contract) {
                            $contracts->cancel($contract);
                            // Explicit audit log for scheduler-driven cancellation (overdue past threshold)
                            $this->logEvent(
                                event: 'contract_cancelled_by_scheduler',
                                subject: $contract,
                                properties: [
                                    'reason'    => 'overdue_invoices_past_threshold',
                                    'threshold' => $threshold,
                                ],
                                description: 'Contract cancelled by scheduler (overdue past threshold)',
                            );
                        }
                    }
                }
            });

        // Case 2: Contracts past grace period with no payable invoices (all invoices cancelled) and no paid invoices
        Contract::query()
            ->select('id')
            ->whereIn('status', [
                ContractStatus::PENDING_PAYMENT->value,
                ContractStatus::BOOKED->value,
                ContractStatus::OVERDUE->value,
            ])
            ->whereDate('start_date', '<=', $threshold)
            // has at least one cancelled invoice OR no invoices at all
            ->where(function ($q) {
                $q->whereDoesntHave('invoices')
                  ->orWhereHas('invoices', function ($iq) {
                      $iq->where('status', InvoiceStatus::CANCELLED->value);
                  });
            })
            // no payable invoices remaining
            ->whereDoesntHave('invoices', function ($q) {
                $q->whereIn('status', [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value]);
            })
            // no paid invoices
            ->whereDoesntHave('invoices', function ($q) {
                $q->where('status', InvoiceStatus::PAID->value);
            })
            ->orderBy('id')
            ->chunkById($chunkSize, function ($rows) use (&$count, $contracts, $threshold, $graceDays): void {
                foreach ($rows as $row) {
                    $count++;
                    if (!$this->option('dry-run')) {
                        $contract = Contract::find($row->id);
                        if ($contract) {
                            $contracts->cancel($contract);
                            // Explicit audit log for scheduler-driven cancellation (no payable invoices past grace)
                            $this->logEvent(
                                event: 'contract_cancelled_by_scheduler',
                                subject: $contract,
                                properties: [
                                    'reason'     => 'no_payable_invoices_past_grace',
                                    'threshold'  => $threshold,
                                    'grace_days' => $graceDays,
                                ],
                                description: 'Contract cancelled by scheduler (no payable invoices past grace)',
                            );
                        }
                    }
                }
            });

        $this->info(($this->option('dry-run') ? '[dry-run] ' : '') . "Queued cancellation jobs for {$count} contract(s). ");

        return self::SUCCESS;
    }
}
