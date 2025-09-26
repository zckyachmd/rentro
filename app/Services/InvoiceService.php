<?php

namespace App\Services;

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Enum\PaymentStatus;
use App\Enum\ProrataCharging;
use App\Enum\RoomStatus;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Contracts\InvoiceServiceInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InvoiceService implements InvoiceServiceInterface
{
    /**
     * Ambil konfigurasi billing sekali (prorata, releaseDom, dueHours, dueDom).
     * @return array{prorata:bool,releaseDom:int,dueHours:int,dueDom:int}
     */
    protected function billingConfig(): array
    {
        $prorata    = (bool) AppSetting::config('billing.prorata', false);
        $releaseDom = (int) AppSetting::config('billing.release_day_of_month', 1);
        $dueHours   = (int) AppSetting::config('contract.invoice_due_hours', 48);
        $dueDom     = (int) AppSetting::config('billing.due_day_of_month', 7);

        return [
            'prorata'    => $prorata,
            'releaseDom' => $releaseDom,
            'dueHours'   => $dueHours,
            'dueDom'     => $dueDom,
        ];
    }

    /**
     * Hitung ringkasan pembayaran untuk sebuah invoice.
     * Mengembalikan total tagihan, total dibayar (Completed), dan outstanding.
     *
     * @return array{total_invoice:int,total_paid:int,outstanding:int}
     */
    public function totals(Invoice $invoice): array
    {
        $totalInvoice = (int) $invoice->amount_cents;
        $totalPaid    = (int) $invoice->payments()
            ->where('status', PaymentStatus::COMPLETED->value)
            ->sum('amount_cents');
        $outstanding = max(0, $totalInvoice - $totalPaid);

        return [
            'total_invoice' => $totalInvoice,
            'total_paid'    => $totalPaid,
            'outstanding'   => $outstanding,
        ];
    }

    /**
     * General-purpose generation wrapper to allow reuse from different contexts.
     * Supported options:
     * - ['month' => 'YYYY-MM'] to generate a single monthly invoice for that month.
     * - ['full' => true] to generate a full remaining coverage invoice.
     */
    public function generate(Contract $contract, array $options = [])
    {
        if (!empty($contract->paid_in_full_at)) {
            throw new \InvalidArgumentException(__('management/invoices.contract_already_paid_in_full'));
        }

        $period           = (string) $contract->billing_period->value;
        $cfg              = $this->billingConfig();
        $prorata          = $cfg['prorata'];
        $releaseDom       = $cfg['releaseDom'];
        $dueHours         = $cfg['dueHours'];
        $dueDom           = $cfg['dueDom'];
        $now              = Carbon::now();
        $dueNonMon        = $now->copy()->addHours(max(1, (int) $dueHours))->toDateString();
        $dueMonthly       = Invoice::nextDueDayFrom($now, max(1, (int) $dueDom));
        $activeStatuses   = [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value, InvoiceStatus::PAID->value];
        $rentCentsMonthly = (int) $contract->rent_cents;

        $latest = $contract->invoices()
            ->where('status', '!=', InvoiceStatus::CANCELLED->value)
            ->orderByDesc('period_end')
            ->first(['id', 'period_start', 'period_end', 'status']);
        /** @var \App\Models\Invoice|null $latest */
        $contractStart = Carbon::parse($contract->start_date)->startOfDay();
        $contractEnd   = Carbon::parse($contract->end_date)->startOfDay();

        if (!empty($options['first'])) {
            $start = $contractStart->copy();
            if ($period === BillingPeriod::MONTHLY->value) {
                $periodEnd = $start->copy()->addMonthNoOverflow()->subDay();
                if ($prorata && $start->day !== $releaseDom) {
                    $periodEnd = $this->nextReleaseDate($start, $releaseDom)->addMonthNoOverflow()->subDay();
                }

                if ($this->hasActiveOverlap($contract, $start, $periodEnd, $activeStatuses)) {
                    throw new \InvalidArgumentException(__('management/invoices.active_overlap_initial'));
                }

                $needsProrata = (bool) ($prorata && $start->day !== $releaseDom);
                $dueDateStr   = $needsProrata
                    ? Invoice::nextDueDayFrom($now, max(1, (int) $releaseDom))
                    : $dueMonthly;
                $items = $this->makeItems(
                    $period,
                    'per_month',
                    (int) $contract->rent_cents,
                    1,
                    $needsProrata,
                    $start,
                    (int) $contract->deposit_cents,
                    $releaseDom,
                );

                return $this->createInvoiceRecord($contract, $start, $periodEnd, $dueDateStr, $items);
            }

            $daysOrWeeks = $period === BillingPeriod::DAILY->value
                ? max(1, (int) $start->diffInDays($contractEnd->copy()->addDay()))
                : max(1, (int) ceil($start->diffInDays($contractEnd->copy()->addDay()) / 7));
            if ($this->hasActiveOverlap($contract, $start, $contractEnd->copy(), $activeStatuses)) {
                throw new \InvalidArgumentException(__('management/invoices.active_overlap_range'));
            }
            $items = $this->makeItems($period, 'full', (int) $contract->rent_cents, $daysOrWeeks, false, $start, (int) $contract->deposit_cents, $releaseDom);

            return $this->createInvoiceRecord($contract, $start, $contractEnd->copy(), $dueNonMon, $items);
        }

        if (!empty($options['month']) && is_string($options['month'])) {
            if ($period !== BillingPeriod::MONTHLY->value) {
                throw new \InvalidArgumentException(__('management/invoices.month_only_for_monthly'));
            }

            try {
                $start = Carbon::createFromFormat('Y-m', (string) $options['month'])->startOfMonth();
            } catch (\Throwable $e) {
                throw new \InvalidArgumentException(__('management/invoices.period_month_invalid'));
            }

            if ($start->lessThan($contractStart->copy()->startOfMonth()) || $start->greaterThan($contractEnd)) {
                throw new \InvalidArgumentException(__('management/invoices.period_month_out_of_range'));
            }

            $isBackfill = !empty($options['backfill']);
            if (!$isBackfill) {
                $expectedStart = $latest
                    ? Carbon::parse($latest->period_end)->addDay()->startOfMonth()
                    : $contractStart->copy()->startOfMonth();
                if (!$start->isSameDay($expectedStart)) {
                    $hint = $expectedStart->locale(app()->getLocale() ?: (string) config('app.fallback_locale', 'en'))
                        ->translatedFormat('F Y');
                    throw new \InvalidArgumentException(__('management/invoices.month_must_be_sequential', ['hint' => $hint]));
                }
            }

            $periodEnd = $start->copy()->addMonthNoOverflow()->subDay();
            if ($periodEnd->greaterThan($contractEnd)) {
                $periodEnd = $contractEnd->copy();
            }

            $expectedFullEnd = $start->copy()->addMonthNoOverflow()->subDay();
            if ($periodEnd->lessThan($expectedFullEnd)) {
                $periodEnd = $contractEnd->copy();
            }

            $baseMonthStart = $start->copy();
            $autoEnd        = $contractEnd->copy();
            $months         = 0;
            $cursor         = $baseMonthStart->copy();
            while (true) {
                $endOfThis = $cursor->copy()->addMonthNoOverflow()->subDay();
                if ($endOfThis->lessThanOrEqualTo($autoEnd)) {
                    $months++;
                    $cursor = $endOfThis->copy()->addDay();
                } else {
                    break;
                }
            }
            $rangeFrom    = $start->copy();
            $rangeTo      = $periodEnd->copy();
            $nonCancelled = [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value, InvoiceStatus::PAID->value];
            if ($this->hasActiveOverlap($contract, $rangeFrom, $rangeTo, $nonCancelled)) {
                throw new \InvalidArgumentException(__('management/invoices.active_overlap_month'));
            }
            $items = $this->makeItems($period, 'per_month', $rentCentsMonthly, 1, false, $start, 0, $releaseDom);

            return $this->createInvoiceRecord($contract, $start, $periodEnd, $dueMonthly, $items);
        }

        if (!empty($options['range']) && is_array($options['range'])) {
            $fromRaw = $options['range']['from'] ?? null;
            $toRaw   = $options['range']['to'] ?? null;
            if (!is_string($fromRaw) || !is_string($toRaw)) {
                throw new \InvalidArgumentException(__('management/invoices.range_invalid_format'));
            }
            try {
                $from = Carbon::parse($fromRaw)->startOfDay();
                $to   = Carbon::parse($toRaw)->startOfDay();
            } catch (\Throwable $e) {
                throw new \InvalidArgumentException(__('management/invoices.date_invalid_format'));
            }
            if ($from->greaterThan($to)) {
                throw new \InvalidArgumentException(__('management/invoices.range_invalid'));
            }
            if ($from->lessThan($contractStart) || $to->greaterThan($contractEnd)) {
                throw new \InvalidArgumentException(__('management/invoices.range_out_of_contract'));
            }
            if ($this->hasActiveOverlap($contract, $from, $to, $activeStatuses)) {
                throw new \InvalidArgumentException(__('management/invoices.active_overlap_range'));
            }

            if ($period === BillingPeriod::MONTHLY->value) {
                $months  = 0;
                $cursor  = $from->copy();
                $aligned = true;
                while (true) {
                    $endOfMonthSpan = $cursor->copy()->addMonthNoOverflow()->subDay();
                    if ($endOfMonthSpan->equalTo($to)) {
                        $months++;
                        break;
                    }
                    if ($endOfMonthSpan->lessThan($to)) {
                        $months++;
                        $cursor = $endOfMonthSpan->copy()->addDay();
                        continue;
                    }
                    $aligned = false;
                    break;
                }
                if (!$aligned || $months <= 0) {
                    throw new \InvalidArgumentException(__('management/invoices.months_range_must_be_full'));
                }

                $items = $this->makeItems($period, 'full', $rentCentsMonthly, $months, false, $from, 0, $releaseDom);

                return $this->createInvoiceRecord($contract, $from, $to, $dueMonthly, $items);
            }

            if ($period === BillingPeriod::DAILY->value) {
                $days  = max(1, (int) $from->diffInDays($to->copy()->addDay()));
                $items = $this->makeItems($period, 'full', (int) $contract->rent_cents, $days, false, $from, 0, $releaseDom);

                return $this->createInvoiceRecord($contract, $from, $to, $dueNonMon, $items);
            }

            // weekly
            $days  = max(1, (int) $from->diffInDays($to->copy()->addDay()));
            $weeks = max(1, (int) ceil($days / 7));
            $items = $this->makeItems($period, 'full', (int) $contract->rent_cents, $weeks, false, $from, 0, $releaseDom);

            return $this->createInvoiceRecord($contract, $from, $to, $dueNonMon, $items);
        }

        $start = $latest ? Carbon::parse($latest->period_end)->addDay()->startOfDay() : $contractStart->copy();
        if ($start->greaterThan($contractEnd)) {
            if ($period === BillingPeriod::MONTHLY->value) {
                $monthStart = $contractEnd->copy()->startOfMonth();
                $periodEnd  = $contractEnd->copy();

                $expectedStart = $latest
                    ? Carbon::parse($latest->period_end)->addDay()->startOfMonth()
                    : $contractStart->copy()->startOfMonth();
                if (!$monthStart->isSameDay($expectedStart)) {
                    $hint = $expectedStart->locale(app()->getLocale() ?: (string) config('app.fallback_locale', 'en'))
                        ->translatedFormat('F Y');
                    throw new \InvalidArgumentException(__('management/invoices.month_must_be_sequential', ['hint' => $hint]));
                }

                $nonCancelled = [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value, InvoiceStatus::PAID->value];
                if ($this->hasActiveOverlap($contract, $monthStart, $periodEnd, $nonCancelled)) {
                    throw new \InvalidArgumentException(__('management/invoices.active_overlap_month'));
                }

                $items = $this->makeItems($period, 'per_month', $rentCentsMonthly, 1, false, $monthStart, 0, $releaseDom);

                return $this->createInvoiceRecord($contract, $monthStart, $periodEnd, $dueMonthly, $items);
            }
            throw new \InvalidArgumentException(__('management/invoices.contract_invalid_for_generation'));
        }

        if ($period === BillingPeriod::MONTHLY->value) {
            $anchor = $start->copy();
            $months = 0;
            $cursor = $anchor->copy();
            while ($cursor->lessThanOrEqualTo($contractEnd)) {
                $months++;
                $cursor = $cursor->copy()->addMonthNoOverflow();
            }
            $months    = max(1, (int) $months);
            $periodEnd = $contractEnd->copy();
            $paidOnly  = [InvoiceStatus::PAID->value];
            if ($this->hasActiveOverlap($contract, $anchor, $periodEnd, $paidOnly)) {
                throw new \InvalidArgumentException(__('management/invoices.period_already_paid'));
            }
            $includeDeposit = !empty($options['include_deposit']);
            $depositCents   = $includeDeposit ? (int) $contract->deposit_cents : 0;
            $items          = $this->makeItems($period, 'full', $rentCentsMonthly, $months, false, $anchor, $depositCents, $releaseDom);

            return $this->createInvoiceRecord($contract, $anchor, $periodEnd, $dueMonthly, $items);
        }

        $daysOrWeeks = $period === BillingPeriod::DAILY->value
            ? max(1, (int) $start->diffInDays($contractEnd->copy()->addDay()))
            : max(1, (int) ceil($start->diffInDays($contractEnd->copy()->addDay()) / 7));
        if ($this->hasActiveOverlap($contract, $start, $contractEnd->copy(), $activeStatuses)) {
            throw new \InvalidArgumentException(__('management/invoices.active_overlap_range'));
        }
        $items = $this->makeItems($period, 'full', (int) $contract->rent_cents, $daysOrWeeks, false, $start, 0, $releaseDom);

        return $this->createInvoiceRecord($contract, $start, $contractEnd->copy(), $dueNonMon, $items);
    }

    /**
     * Get next occurrence of release day-of-month. If start is already on releaseDom, returns the same date.
     */
    protected function nextReleaseDate(Carbon $start, int $releaseDom): Carbon
    {
        $dom       = max(1, min(31, $releaseDom));
        $candidate = $start->copy()->day(min($dom, $start->daysInMonth));
        if ($candidate->isSameDay($start)) {
            return $candidate;
        }
        $next = $start->copy()->addMonthNoOverflow()->day(1);

        return $next->copy()->day(min($dom, $next->daysInMonth));
    }

    /**
     * Compute prorata amount and day span details from start (inclusive)
     * until the next release day (exclusive).
     *
     * @return array{amount:int,days:int,from:string,to:string}
     */
    protected function computeProrataDetail(int $monthlyRentCents, Carbon $start, int $releaseDom): array
    {
        $target = $this->nextReleaseDate($start, $releaseDom);
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
            $days        = $cursor->diffInDays($endOfSegment->copy()->addDay());
            $amount += $perDay * max(0, $days);
            $totalDays += max(0, $days);
            $cursor = $endOfSegment->copy()->addDay();
        }

        $amount    = max(0, (int) $amount);
        $totalDays = max(0, (int) $start->diffInDays($target));
        $perDay    = $totalDays > 0 ? (int) round($amount / $totalDays) : 0;

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

        $chargeMode = strtolower((string) AppSetting::config('billing.prorata_charging', ProrataCharging::FULL->value));
        if (!in_array($chargeMode, ProrataCharging::values(), true)) {
            $chargeMode = ProrataCharging::FULL->value;
        }
        $chargeEnum = match ($chargeMode) {
            ProrataCharging::FREE->value      => ProrataCharging::FREE,
            ProrataCharging::THRESHOLD->value => ProrataCharging::THRESHOLD,
            default                           => ProrataCharging::FULL,
        };
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

                    if ($chargeEnum === ProrataCharging::FREE) {
                        $lineAmt = 0;
                    } elseif ($chargeEnum === ProrataCharging::THRESHOLD) {
                        if ($totalDays <= $freeThresholdDays) {
                            $billableDays = 0;
                            $lineAmt      = 0;
                        } else {
                            $billableDays = max(0, $totalDays - $freeThresholdDays);
                            $lineAmt      = $perDay * $billableDays;
                        }
                    }

                    if ($totalDays > 0) {
                        $items[] = Invoice::makeItem('PRORATA', 'Prorated Rent', $lineAmt, [
                            'days'             => $totalDays,
                            'free_days'        => $chargeEnum === ProrataCharging::THRESHOLD ? $freeThresholdDays : 0,
                            'qty'              => $billableDays,
                            'unit_price_cents' => $billableDays > 0 ? $perDay : 0,
                            'unit'             => 'day',
                            'date_start'       => $pr['from'] ?? $start->toDateString(),
                            'date_end'         => $pr['to'] ?? $start->toDateString(),
                        ]);
                    }
                }

                $baseMonthStart = $needsProrata
                    ? $this->nextReleaseDate($start, $releaseDom)
                    : $start->copy();
                for ($i = 0; $i < max(1, (int) $duration); $i++) {
                    $monthStart = $baseMonthStart->copy()->addMonthsNoOverflow($i);
                    $labelBulan = $monthStart->locale(app()->getLocale() ?: (string) config('app.fallback_locale', 'en'))
                        ->translatedFormat('F Y');
                    $items[] = Invoice::makeItem(
                        'RENT',
                        'Rent',
                        $rent,
                        [
                            'unit'             => 'month',
                            'qty'              => 1,
                            'unit_price_cents' => $rent,
                            'month'            => $monthStart->format('Y-m'),
                            'period_label'     => $labelBulan,
                            'sequence'         => $i + 1,
                            'total_months'     => max(1, (int) $duration),
                        ],
                    );
                }
            } else {
                if ($needsProrata) {
                    $pr           = $this->computeProrataDetail($rent, $start, $releaseDom);
                    $totalDays    = (int) ($pr['days'] ?? 0);
                    $perDay       = (int) round($rent / 30);
                    $billableDays = $totalDays;
                    $lineAmt      = $perDay * $billableDays;

                    if ($chargeEnum === ProrataCharging::FREE) {
                        $lineAmt = 0;
                    } elseif ($chargeEnum === ProrataCharging::THRESHOLD) {
                        if ($totalDays <= $freeThresholdDays) {
                            $billableDays = 0;
                            $lineAmt      = 0;
                        } else {
                            $billableDays = max(0, $totalDays - $freeThresholdDays);
                            $lineAmt      = $perDay * $billableDays;
                        }
                    }

                    if ($totalDays > 0) {
                        $items[] = Invoice::makeItem('PRORATA', 'Prorated Rent', $lineAmt, [
                            'days'             => $totalDays,
                            'free_days'        => $chargeEnum === ProrataCharging::THRESHOLD ? $freeThresholdDays : 0,
                            'qty'              => $billableDays,
                            'unit_price_cents' => $billableDays > 0 ? $perDay : 0,
                            'unit'             => 'day',
                            'date_start'       => $pr['from'] ?? $start->toDateString(),
                            'date_end'         => $pr['to'] ?? $start->toDateString(),
                        ]);
                    }
                }

                $monthStart = $needsProrata
                    ? $this->nextReleaseDate($start, $releaseDom)
                    : $start->copy();
                $labelBulan = $monthStart->locale(app()->getLocale() ?: (string) config('app.fallback_locale', 'en'))
                    ->translatedFormat('F Y');
                $items[] = Invoice::makeItem(
                    'RENT',
                    'Rent',
                    $rent,
                    [
                        'unit'             => 'month',
                        'qty'              => 1,
                        'unit_price_cents' => $rent,
                        'month'            => $monthStart->format('Y-m'),
                        'period_label'     => $labelBulan,
                    ],
                );
            }
        } else {
            $unitLabel = $period === BillingPeriod::DAILY->value ? 'day' : 'week';
            $items[]   = Invoice::makeItem(
                'RENT',
                'Room Rent',
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
        $amount = Invoice::sumItems($items);

        return Invoice::create([
            'contract_id'       => $contract->id,
            'number'            => Invoice::makeNumberFor($amount, Carbon::now()),
            'period_start'      => $periodStart->toDateString(),
            'period_end'        => $periodEnd->toDateString(),
            'due_date'          => $dueDateTime,
            'amount_cents'      => $amount,
            'outstanding_cents' => $amount,
            'items'             => $items,
            'status'            => InvoiceStatus::PENDING->value,
            'paid_at'           => null,
        ]);
    }

    /**
     * Extend due date for a specific invoice (Pending/Overdue only).
     */
    public function extendDue(Invoice $invoice, string $dueDate, ?string $reason = null): ?Invoice
    {
        try {
            return DB::transaction(function () use ($invoice, $dueDate): ?Invoice {
                $invoice->refresh();

                if (!in_array((string) $invoice->status->value, [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value], true)) {
                    return null;
                }

                $newDue            = Carbon::parse($dueDate)->startOfDay();
                $invoice->due_date = $newDue;

                $today = Carbon::now()->startOfDay();
                if ($newDue->greaterThanOrEqualTo($today)) {
                    if ($invoice->status === InvoiceStatus::OVERDUE) {
                        $invoice->status = InvoiceStatus::PENDING;
                    }

                    $contract = $invoice->contract;
                    if ($contract instanceof \App\Models\Contract) {
                        $cStatus         = (string) $contract->status->value;
                        $nonDowngradable = [
                            ContractStatus::ACTIVE->value,
                            ContractStatus::COMPLETED->value,
                            ContractStatus::CANCELLED->value,
                        ];
                        if (!in_array($cStatus, $nonDowngradable, true)) {
                            $contract->status = ContractStatus::PENDING_PAYMENT;
                            $contract->save();

                            $room = $contract->room;
                            if ($room) {
                                $rStatus = (string) $room->status->value;
                                if ($rStatus !== RoomStatus::OCCUPIED->value && $rStatus !== RoomStatus::RESERVED->value) {
                                    $room->update(['status' => RoomStatus::RESERVED->value]);
                                }
                            }
                        }
                    }
                }

                $invoice->save();

                return $invoice;
            });
        } catch (\Throwable $e) {
            Log::error('InvoiceService::extendDue failed', [
                'error'      => $e->getMessage(),
                'trace'      => $e->getTraceAsString(),
                'invoice_id' => $invoice->id,
                'due_date'   => $dueDate,
                'reason'     => $reason,
            ]);
            throw $e;
        }
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
