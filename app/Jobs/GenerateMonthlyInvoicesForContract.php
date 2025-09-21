<?php

namespace App\Jobs;

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Models\Contract;
use App\Services\Contracts\ContractServiceInterface;
use App\Services\Contracts\InvoiceServiceInterface;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateMonthlyInvoicesForContract implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public int $contractId, public string $target)
    {
        $this->onQueue('billing');
    }

    public function handle(InvoiceServiceInterface $invoices, ContractServiceInterface $contractsSvc): void
    {
        /** @var Contract|null $contract */
        $contract = Contract::query()->find($this->contractId);
        if (!$contract) {
            return;
        }

        // Guard: only process active-ish monthly contracts
        $status = (string) $contract->status->value;
        if (in_array($status, [ContractStatus::CANCELLED->value, ContractStatus::COMPLETED->value], true)) {
            return;
        }
        if ((string) $contract->billing_period->value !== BillingPeriod::MONTHLY->value) {
            return;
        }

        try {
            // If no invoice exists at all
            $hasAny = $contract->invoices()->exists();
            if (!$hasAny) {
                if (!empty($contract->paid_in_full_at)) {
                    return;
                }
                $contractsSvc->generateInitialInvoice($contract);

                return;
            }

            // Generate sequentially until target month (catch up) without duplicates
            $latest = $contract->invoices()
                ->where('status', '!=', InvoiceStatus::CANCELLED)
                ->orderByDesc('period_end')
                ->first(['id', 'period_end']);

            $contractStart = Carbon::parse((string) $contract->start_date)->startOfDay();
            $contractEnd   = Carbon::parse((string) $contract->end_date)->startOfDay();
            $targetStart   = Carbon::createFromFormat('Y-m', $this->target)->startOfMonth();

            $expectedStart = ($latest && $latest->getAttribute('period_end'))
                ? Carbon::parse((string) $latest->getAttribute('period_end'))->addDay()->startOfMonth()
                : $contractStart->copy()->startOfMonth();

            while ($expectedStart->lessThanOrEqualTo($targetStart) && $expectedStart->lessThanOrEqualTo($contractEnd)) {
                if ($this->hasDuplicateForMonth($contract, $expectedStart)) {
                    $expectedStart = $expectedStart->copy()->addMonthNoOverflow()->startOfMonth();
                    continue;
                }

                $invoices->generate($contract, ['month' => $expectedStart->format('Y-m')]);

                $expectedStart = $expectedStart->copy()->addMonthNoOverflow()->startOfMonth();
            }
        } catch (\Throwable $e) {
            Log::warning('GenerateMonthlyInvoicesForContract failed', [
                'contract_id' => (string) $this->contractId,
                'target'      => $this->target,
                'error'       => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    protected function hasDuplicateForMonth(Contract $contract, Carbon $monthStart): bool
    {
        $start = $monthStart->copy();
        $end   = $start->copy()->endOfMonth();

        return $contract->invoices()
            ->where('status', '!=', InvoiceStatus::CANCELLED)
            ->whereDate('period_start', '<=', $end->toDateString())
            ->whereDate('period_end', '>=', $start->toDateString())
            ->exists();
    }

    public function tags(): array
    {
        return ['billing', 'invoice:monthly', 'contract:' . $this->contractId, 'target:' . $this->target];
    }
}
