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
use App\Models\Promotion;
use App\Models\PromotionCoupon;
use App\Models\PromotionRedemption;
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
        $totalInvoice = (int) $invoice->amount_idr;
        $totalPaid    = (int) $invoice->payments()
            ->where('status', PaymentStatus::COMPLETED->value)
            ->sum('amount_idr');
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
        $rentCentsMonthly = (int) $contract->rent_idr;

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
                    (int) $contract->rent_idr,
                    1,
                    $needsProrata,
                    $start,
                    (int) $contract->deposit_idr,
                    $releaseDom,
                    $contract,
                    $options['promo'] ?? null,
                );

                return $this->createInvoiceRecord($contract, $start, $periodEnd, $dueDateStr, $items);
            }

            $daysOrWeeks = $period === BillingPeriod::DAILY->value
                ? max(1, (int) $start->diffInDays($contractEnd->copy()->addDay()))
                : max(1, (int) ceil($start->diffInDays($contractEnd->copy()->addDay()) / 7));
            if ($this->hasActiveOverlap($contract, $start, $contractEnd->copy(), $activeStatuses)) {
                throw new \InvalidArgumentException(__('management/invoices.active_overlap_range'));
            }
            $items = $this->makeItems($period, 'full', (int) $contract->rent_idr, $daysOrWeeks, false, $start, (int) $contract->deposit_idr, $releaseDom, $contract, $options['promo'] ?? null);

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
            $items = $this->makeItems($period, 'per_month', $rentCentsMonthly, 1, false, $start, 0, $releaseDom, $contract, $options['promo'] ?? null);

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

                $items = $this->makeItems($period, 'full', $rentCentsMonthly, $months, false, $from, 0, $releaseDom, $contract, $options['promo'] ?? null);

                return $this->createInvoiceRecord($contract, $from, $to, $dueMonthly, $items);
            }

            if ($period === BillingPeriod::DAILY->value) {
                $days  = max(1, (int) $from->diffInDays($to->copy()->addDay()));
                $items = $this->makeItems($period, 'full', (int) $contract->rent_idr, $days, false, $from, 0, $releaseDom, $contract, $options['promo'] ?? null);

                return $this->createInvoiceRecord($contract, $from, $to, $dueNonMon, $items);
            }

            // weekly
            $days  = max(1, (int) $from->diffInDays($to->copy()->addDay()));
            $weeks = max(1, (int) ceil($days / 7));
            $items = $this->makeItems($period, 'full', (int) $contract->rent_idr, $weeks, false, $from, 0, $releaseDom, $contract, $options['promo'] ?? null);

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

                $items = $this->makeItems($period, 'per_month', $rentCentsMonthly, 1, false, $monthStart, 0, $releaseDom, $contract, $options['promo'] ?? null);

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
            $depositCents   = $includeDeposit ? (int) $contract->deposit_idr : 0;
            $items          = $this->makeItems($period, 'full', $rentCentsMonthly, $months, false, $anchor, $depositCents, $releaseDom, $contract, $options['promo'] ?? null);

            return $this->createInvoiceRecord($contract, $anchor, $periodEnd, $dueMonthly, $items);
        }

        $daysOrWeeks = $period === BillingPeriod::DAILY->value
            ? max(1, (int) $start->diffInDays($contractEnd->copy()->addDay()))
            : max(1, (int) ceil($start->diffInDays($contractEnd->copy()->addDay()) / 7));
        if ($this->hasActiveOverlap($contract, $start, $contractEnd->copy(), $activeStatuses)) {
            throw new \InvalidArgumentException(__('management/invoices.active_overlap_range'));
        }
        $items = $this->makeItems($period, 'full', (int) $contract->rent_idr, $daysOrWeeks, false, $start, 0, $releaseDom, $contract, $options['promo'] ?? null);

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
     * @return array<int,array{code:string,label:string,amount_idr:int,meta?:array}>
     */
    protected function makeItems(string $period, string $plan, int $rent, int $duration, bool $prorata, Carbon $start, int $deposit, int $releaseDom, ?\App\Models\Contract $contract = null, ?array $promoOptions = null): array
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

        // Promotion evaluation helpers
        $promoCtxBase = function () use ($contract, $period, $promoOptions) {
            $ctx = [
                'user'        => $contract?->tenant,
                'contract_id' => $contract?->id,
                'channel'     => ($promoOptions['channel'] ?? null),
                'coupon_code' => ($promoOptions['coupon_code'] ?? null),
            ];

            return $ctx;
        };

        $promotionService = app(\App\Services\Contracts\PromotionServiceInterface::class);
        $room             = $contract?->room;

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
                        // Apply promotions to prorata line
                        $appliedPromo = [];
                        if ($room) {
                            $ctx                         = $promoCtxBase();
                            $ctx['current_period_index'] = 1;
                            $ctx['per_day_rate_idr']     = $perDay;
                            $ctx['base_rent_override']   = $lineAmt;
                            $res                         = $promotionService->evaluateForRoom($room, BillingPeriod::MONTHLY, $ctx);
                            if (is_array($res)) {
                                $lineAmt      = (int) ($res['final_rent'] ?? $lineAmt);
                                $appliedPromo = array_map(function ($a) {
                                    /** @var array $a */
                                    /** @var \App\Models\Promotion $p */
                                    $p = $a['promotion'];

                                    return [
                                        'id'               => $p->id,
                                        'slug'             => $p->slug,
                                        'name'             => $p->name,
                                        'discount_rent'    => (int) $a['discount_rent'],
                                        'discount_deposit' => (int) $a['discount_deposit'],
                                        'coupon_id'        => $a['coupon_id'] ?? null,
                                    ];
                                }, $res['applied'] ?? []);
                            }
                        }

                        $items[] = Invoice::makeItem('PRORATA', 'Prorated Rent', $lineAmt, [
                            'days'           => $totalDays,
                            'free_days'      => $chargeEnum === ProrataCharging::THRESHOLD ? $freeThresholdDays : 0,
                            'qty'            => $billableDays,
                            'unit_price_idr' => $billableDays > 0 ? $perDay : 0,
                            'unit'           => 'day',
                            'date_start'     => $pr['from'] ?? $start->toDateString(),
                            'date_end'       => $pr['to'] ?? $start->toDateString(),
                            'promotions'     => $appliedPromo,
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
                    // Apply promotions per month line
                    $lineRent = $rent;
                    $applied  = [];
                    if ($room) {
                        $ctx                         = $promoCtxBase();
                        $ctx['current_period_index'] = $i + 1;
                        $ctx['per_day_rate_idr']     = (int) round($lineRent / 30);
                        $ctx['base_rent_override']   = $lineRent;
                        $res                         = $promotionService->evaluateForRoom($room, BillingPeriod::MONTHLY, $ctx);
                        if (is_array($res)) {
                            $lineRent = (int) ($res['final_rent'] ?? $lineRent);
                            $applied  = array_map(function ($a) {
                                /** @var array $a */
                                /** @var \App\Models\Promotion $p */
                                $p = $a['promotion'];

                                return [
                                    'id'               => $p->id,
                                    'slug'             => $p->slug,
                                    'name'             => $p->name,
                                    'discount_rent'    => (int) $a['discount_rent'],
                                    'discount_deposit' => (int) $a['discount_deposit'],
                                    'coupon_id'        => $a['coupon_id'] ?? null,
                                ];
                            }, $res['applied'] ?? []);
                        }
                    }

                    $items[] = Invoice::makeItem(
                        'RENT',
                        'Rent',
                        $lineRent,
                        [
                            'unit'           => 'month',
                            'qty'            => 1,
                            'unit_price_idr' => $lineRent,
                            'month'          => $monthStart->format('Y-m'),
                            'period_label'   => $labelBulan,
                            'sequence'       => $i + 1,
                            'total_months'   => max(1, (int) $duration),
                            'promotions'     => $applied,
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
                        // Apply promotions to prorata line (per_month plan)
                        $appliedPromo = [];
                        if ($room) {
                            $ctx                         = $promoCtxBase();
                            $ctx['current_period_index'] = 1;
                            $ctx['per_day_rate_idr']     = $perDay;
                            $ctx['base_rent_override']   = $lineAmt;
                            $res                         = $promotionService->evaluateForRoom($room, BillingPeriod::MONTHLY, $ctx);
                            if (is_array($res)) {
                                $lineAmt      = (int) ($res['final_rent'] ?? $lineAmt);
                                $appliedPromo = array_map(function ($a) {
                                    /** @var array $a */
                                    /** @var \App\Models\Promotion $p */
                                    $p = $a['promotion'];

                                    return [
                                        'id'               => $p->id,
                                        'slug'             => $p->slug,
                                        'name'             => $p->name,
                                        'discount_rent'    => (int) $a['discount_rent'],
                                        'discount_deposit' => (int) $a['discount_deposit'],
                                        'coupon_id'        => $a['coupon_id'] ?? null,
                                    ];
                                }, $res['applied'] ?? []);
                            }
                        }

                        $items[] = Invoice::makeItem('PRORATA', 'Prorated Rent', $lineAmt, [
                            'days'           => $totalDays,
                            'free_days'      => $chargeEnum === ProrataCharging::THRESHOLD ? $freeThresholdDays : 0,
                            'qty'            => $billableDays,
                            'unit_price_idr' => $billableDays > 0 ? $perDay : 0,
                            'unit'           => 'day',
                            'date_start'     => $pr['from'] ?? $start->toDateString(),
                            'date_end'       => $pr['to'] ?? $start->toDateString(),
                            'promotions'     => $appliedPromo,
                        ]);
                    }
                }

                $monthStart = $needsProrata
                    ? $this->nextReleaseDate($start, $releaseDom)
                    : $start->copy();
                $labelBulan = $monthStart->locale(app()->getLocale() ?: (string) config('app.fallback_locale', 'en'))
                    ->translatedFormat('F Y');
                $lineRent = $rent;
                $applied  = [];
                if ($room) {
                    $ctx                         = $promoCtxBase();
                    $ctx['current_period_index'] = 1;
                    $ctx['per_day_rate_idr']     = (int) round($lineRent / 30);
                    $ctx['base_rent_override']   = $lineRent;
                    $res                         = $promotionService->evaluateForRoom($room, BillingPeriod::MONTHLY, $ctx);
                    if (is_array($res)) {
                        $lineRent = (int) ($res['final_rent'] ?? $lineRent);
                        $applied  = array_map(function ($a) {
                            /** @var array $a */
                            /** @var \App\Models\Promotion $p */
                            $p = $a['promotion'];

                            return [
                                'id'               => $p->id,
                                'slug'             => $p->slug,
                                'name'             => $p->name,
                                'discount_rent'    => (int) $a['discount_rent'],
                                'discount_deposit' => (int) $a['discount_deposit'],
                                'coupon_id'        => $a['coupon_id'] ?? null,
                            ];
                        }, $res['applied'] ?? []);
                    }
                }
                $items[] = Invoice::makeItem(
                    'RENT',
                    'Rent',
                    $lineRent,
                    [
                        'unit'           => 'month',
                        'qty'            => 1,
                        'unit_price_idr' => $lineRent,
                        'month'          => $monthStart->format('Y-m'),
                        'period_label'   => $labelBulan,
                        'promotions'     => $applied,
                    ],
                );
            }
        } else {
            $unitLabel = $period === BillingPeriod::DAILY->value ? 'day' : 'week';
            for ($i = 0; $i < max(1, (int) $duration); $i++) {
                $lineRent = $rent;
                $applied  = [];
                if ($room) {
                    $ctx                         = $promoCtxBase();
                    $ctx['current_period_index'] = $i + 1;
                    $ctx['per_day_rate_idr']     = $unitLabel === 'day' ? $lineRent : (int) round($lineRent / 7);
                    $ctx['base_rent_override']   = $lineRent;
                    $res                         = $promotionService->evaluateForRoom($room, $period === BillingPeriod::DAILY->value ? BillingPeriod::DAILY : BillingPeriod::WEEKLY, $ctx);
                    if (is_array($res)) {
                        $lineRent = (int) ($res['final_rent'] ?? $lineRent);
                        $applied  = array_map(function ($a) {
                            /** @var array $a */
                            /** @var \App\Models\Promotion $p */
                            $p = $a['promotion'];

                            return [
                                'id'               => $p->id,
                                'slug'             => $p->slug,
                                'name'             => $p->name,
                                'discount_rent'    => (int) $a['discount_rent'],
                                'discount_deposit' => (int) $a['discount_deposit'],
                                'coupon_id'        => $a['coupon_id'] ?? null,
                            ];
                        }, $res['applied'] ?? []);
                    }
                }

                $items[] = Invoice::makeItem(
                    'RENT',
                    'Room Rent',
                    $lineRent,
                    [
                        'unit'           => $unitLabel,
                        'qty'            => 1,
                        'unit_price_idr' => $lineRent,
                        'sequence'       => $i + 1,
                        'total_units'    => max(1, (int) $duration),
                        'promotions'     => $applied,
                    ],
                );
            }
        }

        if ($deposit > 0) {
            $finalDeposit = $deposit;
            $applied      = [];
            if ($room) {
                $ctx                          = $promoCtxBase();
                $ctx['current_period_index']  = 1;
                $ctx['base_deposit_override'] = $finalDeposit;
                $res                          = $promotionService->evaluateForRoom($room, BillingPeriod::MONTHLY, $ctx);
                if (is_array($res)) {
                    $finalDeposit = (int) ($res['final_deposit'] ?? $finalDeposit);
                    $applied      = array_map(function ($a) {
                        /** @var array $a */
                        /** @var \App\Models\Promotion $p */
                        $p = $a['promotion'];

                        return [
                            'id'               => $p->id,
                            'slug'             => $p->slug,
                            'name'             => $p->name,
                            'discount_rent'    => (int) $a['discount_rent'],
                            'discount_deposit' => (int) $a['discount_deposit'],
                            'coupon_id'        => $a['coupon_id'] ?? null,
                        ];
                    }, $res['applied'] ?? []);
                }
            }
            $items[] = Invoice::makeItem('DEPOSIT', 'Deposit', $finalDeposit, ['promotions' => $applied]);
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
        // Enforce promotion usage limits before creating invoice
        $usage = $this->collectPromotionUsageFromItems($items);
        $this->enforcePromotionLimits($contract, $usage);

        $amount = Invoice::sumItems($items);

        return DB::transaction(function () use ($contract, $periodStart, $periodEnd, $dueDateTime, $items, $amount, $usage): Invoice {
            $invoice = Invoice::create([
                'contract_id'     => $contract->id,
                'number'          => Invoice::makeNumberFor($amount, Carbon::now()),
                'period_start'    => $periodStart->toDateString(),
                'period_end'      => $periodEnd->toDateString(),
                'due_date'        => $dueDateTime,
                'amount_idr'      => $amount,
                'outstanding_idr' => $amount,
                'items'           => $items,
                'status'          => InvoiceStatus::PENDING->value,
                'paid_at'         => null,
            ]);

            // Persist redemptions atomically with invoice creation
            $this->persistPromotionRedemptions($invoice, $usage);

            return $invoice;
        });
    }

    /**
     * Extract promotion usages from invoice items meta.
     * @return array<int,array{count:int,discount:int,coupons:array<int,int>}> promotion_id => data with coupon_id=>count map
     */
    protected function collectPromotionUsageFromItems(array $items): array
    {
        $usage = [];
        foreach ($items as $it) {
            $meta   = $it['meta'] ?? [];
            $promos = $meta['promotions'] ?? [];
            if (!is_array($promos)) {
                continue;
            }
            foreach ($promos as $p) {
                $pid = (int) ($p['id'] ?? 0);
                if ($pid <= 0) {
                    continue;
                }
                $discount                = (int) ($p['discount_rent'] ?? 0) + (int) ($p['discount_deposit'] ?? 0);
                $usage[$pid]['count']    = ($usage[$pid]['count'] ?? 0) + 1;
                $usage[$pid]['discount'] = ($usage[$pid]['discount'] ?? 0) + max(0, $discount);
                $cid                     = $p['coupon_id'] ?? null;
                if ($cid) {
                    $cid                          = (int) $cid;
                    $usage[$pid]['coupons'][$cid] = ($usage[$pid]['coupons'][$cid] ?? 0) + 1;
                }
            }
        }

        return $usage;
    }

    /**
     * Check promotion usage limits against existing redemptions.
     * Throws InvalidArgumentException when a limit would be exceeded.
     */
    protected function enforcePromotionLimits(Contract $contract, array $usage): void
    {
        if (empty($usage)) {
            return;
        }

        $userId     = (int) $contract->user_id;
        $contractId = (int) $contract->id;
        $today      = Carbon::now()->startOfDay();
        $monthStart = $today->copy()->startOfMonth();
        $monthEnd   = $today->copy()->endOfMonth();

        $promotionIds = array_map('intval', array_keys($usage));
        $promotions   = Promotion::query()->whereIn('id', $promotionIds)->get()->keyBy('id');

        foreach ($usage as $pid => $data) {
            $p = $promotions->get((int) $pid);
            if (!$p) {
                continue;
            }

            $countInc = (int) ($data['count'] ?? 0);

            // Total quota
            if (!empty($p->total_quota)) {
                $used = (int) PromotionRedemption::query()->where('promotion_id', $p->id)->count();
                if ($used + $countInc > (int) $p->total_quota) {
                    throw new \InvalidArgumentException(__('promotions.limit_total_quota_exceeded'));
                }
            }

            // Per-user limit
            if (!empty($p->per_user_limit)) {
                $used = (int) PromotionRedemption::query()->where('promotion_id', $p->id)->where('user_id', $userId)->count();
                if ($used + $countInc > (int) $p->per_user_limit) {
                    throw new \InvalidArgumentException(__('promotions.limit_per_user_exceeded'));
                }
            }

            // Per-contract limit
            if (!empty($p->per_contract_limit)) {
                $used = (int) PromotionRedemption::query()->where('promotion_id', $p->id)->where('contract_id', $contractId)->count();
                if ($used + $countInc > (int) $p->per_contract_limit) {
                    throw new \InvalidArgumentException(__('promotions.limit_per_contract_exceeded'));
                }
            }

            // Per-invoice limit (check within this single invoice's usage count)
            if (!empty($p->per_invoice_limit)) {
                if ($countInc > (int) $p->per_invoice_limit) {
                    throw new \InvalidArgumentException(__('promotions.limit_per_invoice_exceeded'));
                }
            }

            // Per-day limit
            if (!empty($p->per_day_limit)) {
                $used = (int) PromotionRedemption::query()
                    ->where('promotion_id', $p->id)
                    ->whereDate('redeemed_at', '=', $today->toDateString())
                    ->count();
                if ($used + $countInc > (int) $p->per_day_limit) {
                    throw new \InvalidArgumentException(__('promotions.limit_per_day_exceeded'));
                }
            }

            // Per-month limit
            if (!empty($p->per_month_limit)) {
                $used = (int) PromotionRedemption::query()
                    ->where('promotion_id', $p->id)
                    ->whereDate('redeemed_at', '>=', $monthStart->toDateString())
                    ->whereDate('redeemed_at', '<=', $monthEnd->toDateString())
                    ->count();
                if ($used + $countInc > (int) $p->per_month_limit) {
                    throw new \InvalidArgumentException(__('promotions.limit_per_month_exceeded'));
                }
            }

            // Coupon max_redemptions
            $couponMap = $data['coupons'] ?? [];
            if (!empty($couponMap) && is_array($couponMap)) {
                $couponIds = array_map('intval', array_keys($couponMap));
                $coupons   = PromotionCoupon::query()->whereIn('id', $couponIds)->get()->keyBy('id');
                foreach ($couponMap as $cid => $cCount) {
                    $cpn = $coupons->get((int) $cid);
                    if (!$cpn) {
                        continue;
                    }
                    if (!empty($cpn->max_redemptions)) {
                        $used = (int) PromotionRedemption::query()->where('coupon_id', $cpn->id)->count();
                        if ($used + (int) $cCount > (int) $cpn->max_redemptions) {
                            throw new \InvalidArgumentException(__('promotions.coupon_redeem_limit_exceeded'));
                        }
                    }
                }
            }
        }
    }

    /**
     * Persist promotion redemptions for an invoice.
     */
    protected function persistPromotionRedemptions(Invoice $invoice, array $usage): void
    {
        if (empty($usage)) {
            return;
        }
        $now          = Carbon::now();
        $couponCounts = [];
        foreach ($usage as $pid => $data) {
            $discount  = (int) ($data['discount'] ?? 0);
            $couponMap = $data['coupons'] ?? [];
            if (!empty($couponMap)) {
                foreach ($couponMap as $cid => $count) {
                    for ($i = 0; $i < (int) $count; $i++) {
                        PromotionRedemption::create([
                            'promotion_id' => (int) $pid,
                            'user_id'      => (int) $invoice->contract->user_id,
                            'coupon_id'    => (int) $cid,
                            'contract_id'  => (int) $invoice->contract_id,
                            'invoice_id'   => (int) $invoice->id,
                            'discount_idr' => $discount,
                            'meta'         => null,
                            'redeemed_at'  => $now,
                        ]);
                        $couponCounts[(int) $cid] = ($couponCounts[(int) $cid] ?? 0) + 1;
                    }
                }
            } else {
                for ($i = 0; $i < (int) ($data['count'] ?? 1); $i++) {
                    PromotionRedemption::create([
                        'promotion_id' => (int) $pid,
                        'user_id'      => (int) $invoice->contract->user_id,
                        'coupon_id'    => null,
                        'contract_id'  => (int) $invoice->contract_id,
                        'invoice_id'   => (int) $invoice->id,
                        'discount_idr' => $discount,
                        'meta'         => null,
                        'redeemed_at'  => $now,
                    ]);
                }
            }
        }

        // Increment coupon redeemed_count
        foreach ($couponCounts as $cid => $inc) {
            PromotionCoupon::query()->where('id', (int) $cid)->increment('redeemed_count', (int) $inc);
        }
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
