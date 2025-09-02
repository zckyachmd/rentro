<?php

namespace App\Console\Commands;

use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Models\Contract;
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

    protected $description = 'Mark contracts as OVERDUE when there are overdue pending invoices or no payable invoices (all cancelled), with no paid invoices.';

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
            ->where(function ($q) use ($today) {
                // Case A: has pending invoice past due
                $q->whereHas('invoices', function ($iq) use ($today) {
                    $iq->where('status', InvoiceStatus::PENDING->value)
                        ->where('due_date', '<', $today);
                })
                // Case B: no payable invoices at all (none or all cancelled)
                ->orWhere(function ($qq) {
                    $qq->whereDoesntHave('invoices')
                        ->orWhereDoesntHave('invoices', function ($iq) {
                            $iq->whereIn('status', [
                                InvoiceStatus::PENDING->value,
                                InvoiceStatus::OVERDUE->value,
                                InvoiceStatus::PAID->value,
                            ]);
                        });
                });
            })
            ->whereDoesntHave('invoices', function ($q) {
                $q->where('status', InvoiceStatus::PAID->value);
            })
            ->orderBy('id')
            ->chunkById($chunkSize, function ($rows) use (&$count, $contracts, $today): void {
                foreach ($rows as $row) {
                    $count++;
                    if (!$this->option('dry-run')) {
                        $contract = Contract::find($row->id);
                        if ($contract) {
                            $contracts->markOverdue($contract);
                            // Audit: mark overdue reason
                            $reason     = 'pending_invoices_past_due';
                            $hasPayable = $contract->invoices()->whereIn('status', [
                                InvoiceStatus::PENDING->value,
                                InvoiceStatus::OVERDUE->value,
                            ])->exists();
                            if (!$hasPayable) {
                                $reason = 'no_invoices_or_all_cancelled';
                            }
                            $this->logEvent(
                                event: 'contract_marked_overdue_by_scheduler',
                                subject: $contract,
                                properties: [
                                    'reason' => $reason,
                                    'date'   => $today,
                                ],
                                description: 'Contract marked OVERDUE by scheduler',
                            );
                        }
                    }
                }
            });

        $this->info(($this->option('dry-run') ? '[dry-run] ' : '') . "Queued mark-overdue jobs for {$count} contract(s).");

        return self::SUCCESS;
    }
}
