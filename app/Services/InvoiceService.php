<?php

namespace App\Services;

use App\Enum\BillingPeriod;
use App\Enum\InvoiceStatus;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Models\Invoice;
use App\Services\Contracts\InvoiceServiceInterface;
use Carbon\Carbon;
use Illuminate\Support\Collection;

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
        $target = $this->nextReleaseDate($start, $releaseDom);
        if ($target->lessThanOrEqualTo($start)) {
            return 0;
        }

        $amount = 0;
        $cursor = $start->copy();
        while ($cursor->lessThan($target)) {
            $endOfSegment = $cursor->endOfMonth();
            if ($endOfSegment->greaterThanOrEqualTo($target)) {
                $endOfSegment = $target->copy()->subDay();
            }
            $daysInMonth = $cursor->daysInMonth;
            $perDay      = (int) round($monthlyRentCents / max(1, $daysInMonth));
            $days        = $cursor->diffInDays($endOfSegment->copy()->addDay()); // inclusive of cursor day
            $amount += $perDay * max(0, $days);
            $cursor = $endOfSegment->copy()->addDay();
        }

        return max(0, (int) $amount);
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

        if ($period === BillingPeriod::MONTHLY->value) {
            // Monthly
            if ($plan === 'full') {
                if ($needsProrata) {
                    $p = $this->computeProrataUntilNextRelease($rent, $start, $releaseDom);
                    if ($p > 0) {
                        $items[] = Invoice::makeItem('PRORATA', 'Prorata awal', $p);
                    }
                }
                $items[] = Invoice::makeItem(
                    'RENT',
                    'Sewa 1 bulan × ' . $duration,
                    $rent * $duration,
                    ['unit' => 'bulan', 'qty' => (int) $duration, 'unit_price_cents' => $rent],
                );
            } else { // per_month (first invoice only)
                if ($needsProrata) {
                    $p = $this->computeProrataUntilNextRelease($rent, $start, $releaseDom);
                    if ($p > 0) {
                        $items[] = Invoice::makeItem('PRORATA', 'Prorata awal', $p);
                    }
                }
                $items[] = Invoice::makeItem(
                    'RENT',
                    'Sewa 1 bulan',
                    $rent,
                    ['unit' => 'bulan', 'qty' => 1, 'unit_price_cents' => $rent],
                );
            }
        } else {
            // Weekly / Daily (always pay-in-full)
            $unitLabel = $period === BillingPeriod::DAILY->value ? 'hari' : 'minggu';
            $items[]   = Invoice::makeItem(
                'RENT',
                'Sewa 1 ' . $unitLabel . ' × ' . $duration,
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
}
