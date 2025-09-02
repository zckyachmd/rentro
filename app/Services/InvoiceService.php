<?php

namespace App\Services;

use App\Enum\BillingPeriod;
use App\Enum\InvoiceStatus;
use App\Enum\PaymentStatus;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Contracts\ContractServiceInterface;
use App\Services\Contracts\InvoiceServiceInterface;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InvoiceService implements InvoiceServiceInterface
{
    /**
     * Create initial invoices for a freshly created contract.
     * Returns a collection of Invoice models (persisted).
     *
     * @param Contract $contract
     * @param array $data Validated request data (rent_cents, deposit_cents, billing_period, duration_count, monthly_payment_mode)
     * @return Collection<int, \App\Models\Invoice>
     */
    public function createInitialInvoices(Contract $contract, array $data): Collection
    {
        $start      = Carbon::parse($contract->start_date)->startOfDay();
        $end        = Carbon::parse($contract->end_date)->startOfDay();
        $period     = (string) $contract->billing_period->value;
        $months     = (int) $data['duration_count'];
        $rent       = (int) $data['rent_cents'];
        $deposit    = (int) ($data['deposit_cents'] ?? 0);
        $prorata    = AppSetting::config('billing.prorata', false);
        $releaseDom = (int) AppSetting::config('billing.release_day_of_month', 1);
        $dueHours   = (int) AppSetting::config('contract.invoice_due_hours', 48);
        $dueAt      = Carbon::now()->addHours(max(1, $dueHours));

        $invoices = collect();

        if ($period === BillingPeriod::MONTHLY->value) {
            $plan = strtolower((string) ($data['monthly_payment_mode'] ?? 'per_month'));

            if ($plan === 'full') {
                $items = $this->makeItems($period, 'full', $rent, $months, $prorata, $start, $deposit, $releaseDom);
                $invoices->push(
                    $this->createInvoiceRecord(
                        $contract,
                        $start,
                        $end,
                        $dueAt->toDateTimeString(),
                        $items,
                    ),
                );
            } else {
                // per_month: create only first invoice, scheduler will generate next
                if ($prorata && $start->day !== $releaseDom) {
                    // First invoice covers: prorata (remaining current month) + 1 full month + deposit; next months: rent only via scheduler
                    $firstPeriodEnd = $this->nextReleaseDate($start, $releaseDom);
                    $items          = $this->makeItems($period, 'per_month', $rent, $months, $prorata, $start, $deposit, $releaseDom);
                    $invoices->push(
                        $this->createInvoiceRecord(
                            $contract,
                            $start,
                            $firstPeriodEnd,
                            $dueAt->toDateTimeString(),
                            $items,
                        ),
                    );
                } else {
                    $firstEnd = $start->copy()->addMonthNoOverflow()->subDay();
                    $items    = $this->makeItems($period, 'per_month', $rent, $months, false, $start, $deposit, $releaseDom);
                    $invoices->push(
                        $this->createInvoiceRecord(
                            $contract,
                            $start,
                            $firstEnd,
                            $dueAt->toDateTimeString(),
                            $items,
                        ),
                    );
                }
            }
        } else {
            // daily/weekly
            $multiplier = max(1, (int) ($data['duration_count'] ?? 1));
            $items      = $this->makeItems($period, 'full', $rent, $multiplier, false, $start, $deposit, $releaseDom);
            $invoices->push(
                $this->createInvoiceRecord(
                    $contract,
                    $start,
                    $end,
                    $dueAt->toDateTimeString(),
                    $items,
                ),
            );
        }

        return $invoices;
    }

    /**
     * Generate next invoice for contract according to mode (per_month|full), centralizing logic here.
     */
    public function generateNextInvoice(Contract $contract, string $mode, string $target = 'next'): Invoice
    {
        /** @var \App\Models\Invoice|null $latest */
        $latest = $contract->invoices()->orderByDesc('period_end')->first();
        $start  = $latest instanceof Invoice
            ? Carbon::parse($latest->period_end)->addDay()->startOfDay()
            : Carbon::parse($contract->start_date)->startOfDay();
        $target = in_array($target, ['current', 'next'], true) ? $target : 'next';
        $end    = Carbon::parse($contract->end_date)->startOfDay();

        if (!$end || $start->greaterThan($end)) {
            throw new \InvalidArgumentException('Kontrak sudah selesai atau tidak valid untuk generate invoice.');
        }

        $period     = (string) $contract->billing_period->value;
        $prorata    = (bool) \App\Models\AppSetting::config('billing.prorata', false);
        $releaseDom = (int) \App\Models\AppSetting::config('billing.release_day_of_month', 1);
        $dueHours   = (int) \App\Models\AppSetting::config('contract.invoice_due_hours', 48);
        $dueAt      = Carbon::now()->addHours(max(1, $dueHours));

        /** @var array<int,array{code:string,label:string,amount_cents:int,meta?:array}>|null $items */
        $items          = null;
        $periodEnd      = $end->copy();
        $activeStatuses = [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value, InvoiceStatus::PAID->value];

        if ($period === BillingPeriod::MONTHLY->value) {
            // For 'current' target, anchor to the latest invoice period_start if available
            $currentAnchor = $start->copy();
            if ($latest instanceof Invoice) {
                $currentAnchor = Carbon::parse($latest->period_start)->startOfDay();
            }
            if ($mode === 'per_month') {
                if ($target === 'current' && $latest instanceof Invoice) {
                    // Block regenerate if latest is still active (payable/paid)
                    if (in_array((string) $latest->status->value, $activeStatuses, true)) {
                        throw new \InvalidArgumentException('Invoice aktif untuk periode ini sudah ada.');
                    }
                    // Regenerate the same period as the latest invoice, duplicating items for exact match
                    $start     = Carbon::parse($latest->period_start)->startOfDay();
                    $periodEnd = Carbon::parse($latest->period_end)->startOfDay();
                    $items     = is_array($latest->items) ? $latest->items : [];
                } elseif ($prorata && $start->day !== $releaseDom) {
                    // cover prorata + 1 month
                    $periodEnd = $this->nextReleaseDate($start, $releaseDom)->addMonthNoOverflow()->subDay();
                } else {
                    $periodEnd = $start->copy()->addMonthNoOverflow()->subDay();
                }
                if ($periodEnd->greaterThan($end)) {
                    $periodEnd = $end->copy();
                }
                // If targeting next month, ensure full month span; otherwise advise using full mode
                if ($target === 'next') {
                    $expectedFullEnd = $start->copy()->addMonthNoOverflow()->subDay();
                    if ($periodEnd->lessThan($expectedFullEnd)) {
                        throw new \InvalidArgumentException('Sisa masa kontrak tidak cukup untuk 1 bulan. Gunakan mode Lunas.');
                    }
                }
                // Prevent overlap with any active invoice in the intended range
                if ($this->hasActiveOverlap($contract, $start, $periodEnd, $activeStatuses)) {
                    throw new \InvalidArgumentException('Sudah ada invoice aktif untuk periode tersebut.');
                }
                // Deposit should not be included in generated invoices unless duplicating existing
                if ($items === null) {
                    $items = $this->makeItems($period, 'per_month', (int) $contract->rent_cents, 1, $prorata, $start, 0, $releaseDom);
                }
            } else { // full
                // months until end (from chosen anchor)
                $anchor = $target === 'current' ? $currentAnchor : $start->copy();
                $months = 0;
                $cursor = $anchor->copy();
                while ($cursor->lessThanOrEqualTo($end)) {
                    $months++;
                    $cursor = $cursor->copy()->addMonthNoOverflow();
                }
                $months    = max(1, (int) $months);
                $periodEnd = $end->copy();
                if ($this->hasActiveOverlap($contract, $anchor, $periodEnd, $activeStatuses)) {
                    throw new \InvalidArgumentException('Masih ada invoice aktif pada periode yang akan ditagihkan.');
                }
                $items = $this->makeItems($period, 'full', (int) $contract->rent_cents, $months, $prorata, $anchor, 0, $releaseDom);
            }
        } else {
            // daily/weekly: always pay-in-full for the remaining duration
            $daysOrWeeks = $period === BillingPeriod::DAILY->value
                ? max(1, (int) $start->diffInDays($end->copy()->addDay()))
                : max(1, (int) ceil($start->diffInDays($end->copy()->addDay()) / 7));
            if ($this->hasActiveOverlap($contract, $start, $end->copy(), $activeStatuses)) {
                throw new \InvalidArgumentException('Sudah ada invoice aktif pada rentang waktu ini.');
            }
            $items     = $this->makeItems($period, 'full', (int) $contract->rent_cents, $daysOrWeeks, false, $start, 0, $releaseDom);
            $periodEnd = $end->copy();
        }

        return $this->createInvoiceRecord($contract, $start, $periodEnd, $dueAt->toDateTimeString(), $items);
    }

    /**
     * Get next occurrence of release day-of-month. If start is already on releaseDom, returns the same date.
     */
    protected function nextReleaseDate(Carbon $start, int $releaseDom): Carbon
    {
        $dom       = max(1, min(31, $releaseDom));
        $candidate = $start->copy()->day(min($dom, $start->daysInMonth));
        if ($candidate->isSameDay($start)) {
            return $candidate; // already on release day
        }
        // always go to next month occurrence when not on release day
        $next = $start->copy()->addMonthNoOverflow()->day(1);

        return $next->copy()->day(min($dom, $next->daysInMonth));
    }

    /**
     * Compute prorate amount from start (inclusive) until the *next* release day (exclusive),
     * charging per day using the rent of each month, proportional to its days.
     */
    protected function computeProrataUntilNextRelease(int $monthlyRentCents, Carbon $start, int $releaseDom): int
    {
        // Backward-compatible shim; prefer computeProrataDetail
        $detail = $this->computeProrataDetail($monthlyRentCents, $start, $releaseDom);

        return $detail['amount'];
    }

    /**
     * Compute prorata amount and day span details from start (inclusive)
     * until the next release day (exclusive).
     *
     * @return array{amount:int,days:int,from:string,to:string}
     */
    protected function computeProrataDetail(int $monthlyRentCents, Carbon $start, int $releaseDom): array
    {
        $target = $this->nextReleaseDate($start, $releaseDom); // exclusive end (release day itself)
        if ($target->lessThanOrEqualTo($start)) {
            return [
                'amount'  => 0,
                'days'    => 0,
                'from'    => $start->toDateString(),
                'to'      => $start->copy()->subDay()->toDateString(),
                'per_day' => 0,
            ];
        }

        $amount    = 0;
        $totalDays = 0;
        $cursor    = $start->copy();
        while ($cursor->lessThan($target)) {
            $endOfSegment = $cursor->endOfMonth();
            if ($endOfSegment->greaterThanOrEqualTo($target)) {
                $endOfSegment = $target->copy()->subDay();
            }
            $daysInMonth = $cursor->daysInMonth;
            $perDay      = (int) round($monthlyRentCents / max(1, $daysInMonth));
            $days        = $cursor->diffInDays($endOfSegment->copy()->addDay()); // inclusive of cursor day
            $amount += $perDay * max(0, $days);
            $totalDays += max(0, $days);
            $cursor = $endOfSegment->copy()->addDay();
        }

        $amount = max(0, (int) $amount);
        // Prefer direct day difference to avoid any off-by-one from the loop
        $totalDays = max(0, (int) $start->diffInDays($target));
        $perDay    = $totalDays > 0 ? (int) round($amount / $totalDays) : 0; // averaged to fit subtotal

        return [
            'amount'  => $amount,
            'days'    => $totalDays,
            'from'    => $start->toDateString(),
            'to'      => $target->copy()->subDay()->toDateString(),
            'per_day' => $perDay,
        ];
    }

    /**
     * Build invoice items in one place based on period & plan.
     *
     * @param string $period monthly|weekly|daily (lowercase value of BillingPeriod)
     * @param string $plan 'full' for pay-in-full, 'per_month' for monthly plan's first invoice
     * @param int $rent unit price in cents (per month/week/day)
     * @param int $duration months for monthly-full OR count of weeks/days for non-monthly; ignored for per_month (fixed 1)
     * @param bool $prorata whether prorata is enabled (when start not equal to releaseDom)
     * @param Carbon $start
     * @param int $deposit deposit cents (>= 0)
     * @param int $releaseDom release day-of-month for billing (1-31)
     * @return array<int,array{code:string,label:string,amount_cents:int,meta?:array}>
     */
    protected function makeItems(string $period, string $plan, int $rent, int $duration, bool $prorata, Carbon $start, int $deposit, int $releaseDom): array
    {
        $items        = [];
        $needsProrata = $prorata && $start->day !== $releaseDom;

        // Prorata charging strategy from app settings
        $chargeMode = strtolower((string) AppSetting::config('billing.prorata_charging', 'full')); // full|free|threshold
        if (!in_array($chargeMode, ['full', 'free', 'threshold'], true)) {
            $chargeMode = 'full';
        }
        $freeThresholdDays = (int) AppSetting::config('billing.prorata_free_threshold_days', 7);

        if ($period === BillingPeriod::MONTHLY->value) {
            // Monthly
            if ($plan === 'full') {
                if ($needsProrata) {
                    $pr           = $this->computeProrataDetail($rent, $start, $releaseDom);
                    $totalDays    = (int) ($pr['days'] ?? 0);
                    $perDay       = (int) round($rent / 30);
                    $billableDays = $totalDays;
                    $lineAmt      = $perDay * $billableDays;

                    if ($chargeMode === 'free') {
                        $lineAmt = 0;
                    } elseif ($chargeMode === 'threshold') {
                        if ($totalDays <= $freeThresholdDays) {
                            $billableDays = 0;
                            $lineAmt      = 0;
                        } else {
                            $billableDays = max(0, $totalDays - $freeThresholdDays);
                            $lineAmt      = $perDay * $billableDays;
                        }
                    }

                    if ($totalDays > 0) {
                        $items[] = Invoice::makeItem('PRORATA', 'Prorata sewa kamar', $lineAmt, [
                            'days'             => $totalDays,      // total prorata span
                            'free_days'        => $chargeMode === 'threshold' ? $freeThresholdDays : 0,
                            'qty'              => $billableDays,   // billable days
                            'unit_price_cents' => $billableDays > 0 ? $perDay : 0,
                            'unit'             => 'hari',
                            'date_start'       => $pr['from'] ?? $start->toDateString(),
                            'date_end'         => $pr['to'] ?? $start->toDateString(),
                        ]);
                    }
                }
                $items[] = Invoice::makeItem(
                    'RENT',
                    'Sewa kamar',
                    $rent * $duration,
                    ['unit' => 'bulan', 'qty' => (int) $duration, 'unit_price_cents' => $rent],
                );
            } else { // per_month (first invoice only)
                if ($needsProrata) {
                    $pr           = $this->computeProrataDetail($rent, $start, $releaseDom);
                    $totalDays    = (int) ($pr['days'] ?? 0);
                    $perDay       = (int) round($rent / 30);
                    $billableDays = $totalDays;
                    $lineAmt      = $perDay * $billableDays;

                    if ($chargeMode === 'free') {
                        $lineAmt = 0;
                    } elseif ($chargeMode === 'threshold') {
                        if ($totalDays <= $freeThresholdDays) {
                            $billableDays = 0;
                            $lineAmt      = 0;
                        } else {
                            $billableDays = max(0, $totalDays - $freeThresholdDays);
                            $lineAmt      = $perDay * $billableDays;
                        }
                    }

                    if ($totalDays > 0) {
                        $items[] = Invoice::makeItem('PRORATA', 'Prorata sewa kamar', $lineAmt, [
                            'days'             => $totalDays,
                            'free_days'        => $chargeMode === 'threshold' ? $freeThresholdDays : 0,
                            'qty'              => $billableDays,
                            'unit_price_cents' => $billableDays > 0 ? $perDay : 0,
                            'unit'             => 'hari',
                            'date_start'       => $pr['from'] ?? $start->toDateString(),
                            'date_end'         => $pr['to'] ?? $start->toDateString(),
                        ]);
                    }
                }
                $items[] = Invoice::makeItem(
                    'RENT',
                    'Sewa kamar',
                    $rent,
                    ['unit' => 'bulan', 'qty' => 1, 'unit_price_cents' => $rent],
                );
            }
        } else {
            // Weekly / Daily (always pay-in-full)
            $unitLabel = $period === BillingPeriod::DAILY->value ? 'hari' : 'minggu';
            $items[]   = Invoice::makeItem(
                'RENT',
                'Sewa kamar',
                $rent * $duration,
                ['unit' => $unitLabel, 'qty' => (int) $duration, 'unit_price_cents' => $rent],
            );
        }

        if ($deposit > 0) {
            $items[] = Invoice::makeItem('DEPOSIT', 'Deposit', $deposit);
        }

        return $items;
    }

    /**
     * Check overlapping invoices with active statuses to avoid duplicates/anomalies.
     * Active includes Pending, Overdue, and Paid (non-cancelled).
     */
    protected function hasActiveOverlap(Contract $contract, Carbon $from, Carbon $to, array $activeStatuses): bool
    {
        return Invoice::query()
            ->where('contract_id', $contract->id)
            ->whereDate('period_start', '<=', $to->toDateString())
            ->whereDate('period_end', '>=', $from->toDateString())
            ->whereIn('status', $activeStatuses)
            ->exists();
    }

    /**
     * Persist a single invoice record with items and computed total.
     */
    protected function createInvoiceRecord(Contract $contract, Carbon $periodStart, Carbon $periodEnd, string $dueDateTime, array $items): Invoice
    {
        return Invoice::create([
            'contract_id'  => $contract->id,
            'number'       => Invoice::makeNumber(),
            'period_start' => $periodStart->toDateString(),
            'period_end'   => $periodEnd->toDateString(),
            'due_date'     => $dueDateTime,
            'amount_cents' => Invoice::sumItems($items),
            'items'        => $items,
            'status'       => InvoiceStatus::PENDING,
            'paid_at'      => null,
        ]);
    }

    /**
     * Cancel a single invoice safely.
     */
    public function cancel(Invoice $invoice, ?string $reason = null): bool
    {
        try {
            return DB::transaction(function () use ($invoice): bool {
                $invoice->refresh();

                if ($invoice->status === InvoiceStatus::CANCELLED) {
                    return false;
                }

                Payment::query()
                    ->where('invoice_id', $invoice->id)
                    ->where('status', PaymentStatus::PENDING->value)
                    ->update(['status' => PaymentStatus::CANCELLED->value]);

                $invoice->forceFill([
                    'status'  => InvoiceStatus::CANCELLED,
                    'paid_at' => null,
                ])->save();

                // If this is the only invoice on the contract, cancel the contract as well
                /** @var Contract|null $contract */
                $contract = $invoice->contract()->first();
                if ($contract) {
                    $count = Invoice::query()
                        ->where('contract_id', $contract->id)
                        ->count();
                    if ($count === 1) {
                        /** @var ContractServiceInterface $contracts */
                        $contracts = app(ContractServiceInterface::class);
                        $contracts->cancel($contract);
                    }
                }

                return true;
            });
        } catch (\Throwable $e) {
            Log::error('InvoiceService::cancel failed', [
                'error'      => $e->getMessage(),
                'trace'      => $e->getTraceAsString(),
                'invoice_id' => $invoice->id,
                'reason'     => $reason,
            ]);
            throw $e;
        }
    }
}
