<?php

namespace App\Services;

use App\Enum\BillingPeriod;
use App\Enum\PromotionActionType;
use App\Enum\PromotionChannel;
use App\Enum\PromotionScopeType;
use App\Enum\PromotionStackMode;
use App\Models\Invoice;
use App\Models\Promotion;
use App\Models\PromotionCoupon;
use App\Models\Room;
use App\Models\User;
use App\Services\Contracts\PromotionServiceInterface;
use Carbon\CarbonImmutable;

class PromotionService implements PromotionServiceInterface
{
    public function evaluateForRoom(Room $room, BillingPeriod|string $period, array $context = []): array
    {
        $period              = $period instanceof BillingPeriod ? $period : BillingPeriod::from(strtolower((string) $period));
        $now                 = isset($context['now']) ? CarbonImmutable::parse($context['now']) : CarbonImmutable::now();
        $user                = $context['user'] ?? null;        /** @var User|null $user */
        $invoice             = $context['invoice'] ?? null;    /** @var Invoice|null $invoice */
        $contractId          = $context['contract_id'] ?? null; // int|null
        $channel             = isset($context['channel']) && $context['channel'] ? PromotionChannel::from(strtolower($context['channel'])) : null;
        $couponCode          = $context['coupon_code'] ?? null;
        $baseRentOverride    = array_key_exists('base_rent_override', $context) ? $context['base_rent_override'] : null;
        $baseDepositOverride = array_key_exists('base_deposit_override', $context) ? $context['base_deposit_override'] : null;

        $baseRent    = $baseRentOverride !== null ? (int) $baseRentOverride : $room->effectivePriceCents($period->value);
        $baseDeposit = $baseDepositOverride !== null ? (int) $baseDepositOverride : $room->effectiveDepositCents($period->value);

        // Early exit if no base price
        if ($baseRent === null && $baseDeposit === null) {
            return [
                'base_rent'     => $baseRent,
                'base_deposit'  => $baseDeposit,
                'final_rent'    => $baseRent,
                'final_deposit' => $baseDeposit,
                'applied'       => [],
            ];
        }

        $query = Promotion::query()
            ->where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('valid_from')->orWhere('valid_from', '<=', $now->toDateString());
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('valid_until')->orWhere('valid_until', '>=', $now->toDateString());
            })
            ->orderBy('priority')
            ->with(['rules', 'actions', 'scopes']);

        // Coupon only promos if code is provided or required
        if ($couponCode) {
            $query->where(function ($q) {
                $q->where('require_coupon', true)->orWhereNull('require_coupon');
            });
        } else {
            $query->where(function ($q) {
                $q->where('require_coupon', false)->orWhereNull('require_coupon');
            });
        }

        $promos = $query->get();

        // Optional: filter by scope
        $promos = $promos->filter(function (Promotion $p) use ($room) {
            /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\PromotionScope> $scopes */
            $scopes = $p->scopes;
            if ($scopes->isEmpty()) {
                return true; // global
            }
            foreach ($scopes as $s) {
                /** @var \App\Models\PromotionScope $s */
                $type = $s->scope_type;
                if ($type === PromotionScopeType::GLOBAL) {
                    return true;
                }
                if ($type === PromotionScopeType::BUILDING && $s->building_id && (int) $s->building_id === (int) $room->building_id) {
                    return true;
                }
                if ($type === PromotionScopeType::FLOOR && $s->floor_id && (int) $s->floor_id === (int) $room->floor_id) {
                    return true;
                }
                if ($type === PromotionScopeType::ROOM_TYPE && $s->room_type_id && (int) $s->room_type_id === (int) $room->room_type_id) {
                    return true;
                }
                if ($type === PromotionScopeType::ROOM && $s->room_id && (int) $s->room_id === (int) $room->id) {
                    return true;
                }
            }

            return false;
        });

        // If coupon is provided, ensure the code is valid for one of the promotions
        $coupon = null;
        if ($couponCode) {
            $coupon = PromotionCoupon::query()
                ->whereIn('promotion_id', $promos->pluck('id'))
                ->where('code', $couponCode)
                ->where('is_active', true)
                ->where(function ($q) use ($now) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>=', $now);
                })
                ->first();
            if (!$coupon) {
                // Invalid code; no promo applies
                return [
                    'base_rent'     => $baseRent,
                    'base_deposit'  => $baseDeposit,
                    'final_rent'    => $baseRent,
                    'final_deposit' => $baseDeposit,
                    'applied'       => [],
                ];
            }
            $promos = $promos->where('id', $coupon->promotion_id);
        }

        // Evaluate each promo's rules and compute discounts
        $applied = [];
        foreach ($promos as $promo) {
            // Channel check (header-level default)
            if ($promo->default_channel && $channel && $promo->default_channel !== $channel) {
                continue;
            }

            // Rule checks
            $rules = $promo->rules;
            if ($rules->isNotEmpty()) {
                $ok = false;
                foreach ($rules as $r) {
                    if ($this->rulePasses($r, $period, $now, $user, $channel, $baseRent, $baseDeposit, $context)) {
                        $ok = true;
                        break;
                    }
                }
                if (!$ok) {
                    continue;
                }
            }

            // Compute discount from actions
            $discountRent    = 0;
            $discountDeposit = 0;
            $actionBreakdown = [];
            foreach ($promo->actions as $action) {
                $res = $this->applyAction($action, $period, $baseRent, $baseDeposit, $context);
                if ($res['discount_rent'] > 0 || $res['discount_deposit'] > 0) {
                    $discountRent += $res['discount_rent'];
                    $discountDeposit += $res['discount_deposit'];
                    $actionBreakdown[] = ['action' => $action, 'discount_rent' => $res['discount_rent'], 'discount_deposit' => $res['discount_deposit']];
                }
            }

            // Clamp to base amounts
            $discountRent    = max(0, min((int) ($baseRent ?? 0), (int) $discountRent));
            $discountDeposit = max(0, min((int) ($baseDeposit ?? 0), (int) $discountDeposit));

            if ($discountRent > 0 || $discountDeposit > 0) {
                $applied[] = [
                    'promotion'        => $promo,
                    'discount_rent'    => $discountRent,
                    'discount_deposit' => $discountDeposit,
                    'actions'          => $actionBreakdown,
                    'stack_mode'       => $promo->stack_mode,
                    'coupon_id'        => $coupon?->id,
                ];
            }
        }

        if (empty($applied)) {
            return [
                'base_rent'     => $baseRent,
                'base_deposit'  => $baseDeposit,
                'final_rent'    => $baseRent,
                'final_deposit' => $baseDeposit,
                'applied'       => [],
            ];
        }

        // Stacking resolution
        $exclusive = collect($applied)->filter(fn ($a) => $a['stack_mode'] === PromotionStackMode::EXCLUSIVE)->values();
        if ($exclusive->isNotEmpty()) {
            $winner  = $exclusive->sortByDesc(fn ($a) => $a['discount_rent'] + $a['discount_deposit'])->first();
            $applied = [$winner];
        } else {
            $highestOnly = collect($applied)->filter(fn ($a) => $a['stack_mode'] === PromotionStackMode::HIGHEST_ONLY)->values();
            $stackable   = collect($applied)->filter(fn ($a) => $a['stack_mode'] === PromotionStackMode::STACK)->values();

            if ($highestOnly->isNotEmpty()) {
                $best    = $highestOnly->sortByDesc(fn ($a) => $a['discount_rent'] + $a['discount_deposit'])->first();
                $applied = array_values(array_merge([$best], $stackable->all()));
            } else {
                $applied = $stackable->all();
            }
        }

        // Sum and clamp
        $totalRent    = array_sum(array_column($applied, 'discount_rent'));
        $totalDeposit = array_sum(array_column($applied, 'discount_deposit'));
        $finalRent    = $baseRent !== null ? max(0, (int) $baseRent - (int) $totalRent) : null;
        $finalDeposit = $baseDeposit !== null ? max(0, (int) $baseDeposit - (int) $totalDeposit) : null;

        return [
            'base_rent'     => $baseRent,
            'base_deposit'  => $baseDeposit,
            'final_rent'    => $finalRent,
            'final_deposit' => $finalDeposit,
            'applied'       => $applied,
        ];
    }

    private function rulePasses($r, BillingPeriod $period, CarbonImmutable $now, ?User $user, ?PromotionChannel $channel, ?int $baseRent, ?int $baseDeposit, array $context): bool
    {
        if ($r->channel && $channel && $r->channel !== $channel) {
            return false;
        }
        if ($r->date_from && $now->lt(CarbonImmutable::parse($r->date_from))) {
            return false;
        }
        if ($r->date_until && $now->gt(CarbonImmutable::parse($r->date_until)->endOfDay())) {
            return false;
        }
        if ($r->days_of_week && is_array($r->days_of_week)) {
            $dow     = (int) $now->isoWeekday(); // 1..7
            $allowed = array_map('intval', $r->days_of_week);
            if (!in_array($dow, $allowed, true)) {
                return false;
            }
        }
        if ($r->time_start || $r->time_end) {
            $t = $now->toTimeString('minute');
            if ($r->time_start && $t < $r->time_start) {
                return false;
            }
            if ($r->time_end && $t > $r->time_end) {
                return false;
            }
        }
        if ($r->billing_periods && is_array($r->billing_periods)) {
            if (!in_array($period->value, array_map('strtolower', $r->billing_periods), true)) {
                return false;
            }
        }
        if ($user && $r->allowed_user_ids && is_array($r->allowed_user_ids)) {
            if (!in_array((int) $user->id, array_map('intval', $r->allowed_user_ids), true)) {
                return false;
            }
        }
        if ($user && $r->allowed_role_names && is_array($r->allowed_role_names)) {
            $userRoleNames = $user->roles->pluck('name')->map(fn ($n) => strtolower((string) $n))->all();
            $allowed       = array_map(fn ($n) => strtolower((string) $n), $r->allowed_role_names);
            if (empty(array_intersect($userRoleNames, $allowed))) {
                return false;
            }
        }
        $minSpend = (int) ($r->min_spend_idr ?? 0);
        if ($minSpend > 0) {
            $basis = 0;
            if ($r->applies_to_rent && $baseRent !== null) {
                $basis += (int) $baseRent;
            }
            if ($r->applies_to_deposit && $baseDeposit !== null) {
                $basis += (int) $baseDeposit;
            }
            if ($basis < $minSpend) {
                return false;
            }
        }
        if ($r->first_n_periods) {
            $idx = (int) ($context['current_period_index'] ?? 1);
            if ($idx > (int) $r->first_n_periods) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return array{discount_rent:int,discount_deposit:int}
     */
    private function applyAction($action, BillingPeriod $period, ?int $baseRent, ?int $baseDeposit, array $context): array
    {
        $discountRent = 0;
        $discountDep  = 0;
        $cap          = (int) ($action->max_discount_idr ?? 0);

        $applyCap = function (int $value) use ($cap): int {
            if ($cap > 0) {
                return min($value, $cap);
            }

            return $value;
        };

        $applyPercent = function (?int $base, ?int $percentBps) use ($applyCap): int {
            if ($base === null || !$percentBps) {
                return 0;
            }
            $raw = (int) floor(((int) $base) * ((int) $percentBps) / 10_000);

            return $applyCap($raw);
        };

        $applyAmount = function (?int $base, ?int $amount) use ($applyCap): int {
            if ($base === null || !$amount) {
                return 0;
            }
            $raw = min((int) $base, (int) $amount);

            return $applyCap($raw);
        };

        $applyFixedPrice = function (?int $base, ?int $fixed) use ($applyCap): int {
            if ($base === null || $fixed === null) {
                return 0;
            }
            $raw = max(0, (int) $base - (int) $fixed);

            return $applyCap($raw);
        };

        $eligiblePeriodIndex = (int) ($context['current_period_index'] ?? 1);

        switch ($action->action_type) {
            case PromotionActionType::PERCENT:
                if ($action->applies_to_rent) {
                    $discountRent += $applyPercent($baseRent, (int) $action->percent_bps);
                }
                if ($action->applies_to_deposit) {
                    $discountDep += $applyPercent($baseDeposit, (int) $action->percent_bps);
                }
                break;

            case PromotionActionType::AMOUNT:
                if ($action->applies_to_rent) {
                    $discountRent += $applyAmount($baseRent, (int) $action->amount_idr);
                }
                if ($action->applies_to_deposit) {
                    $discountDep += $applyAmount($baseDeposit, (int) $action->amount_idr);
                }
                break;

            case PromotionActionType::FIXED_PRICE:
                if ($action->applies_to_rent) {
                    $discountRent += $applyFixedPrice($baseRent, (int) $action->fixed_price_idr);
                }
                if ($action->applies_to_deposit) {
                    $discountDep += $applyFixedPrice($baseDeposit, (int) $action->fixed_price_idr);
                }
                break;

            case PromotionActionType::FREE_N_DAYS:
                if ($action->n_days && $action->applies_to_rent) {
                    $perDay = (int) ($context['per_day_rate_idr'] ?? ($baseRent ? (int) floor($baseRent / 30) : 0));
                    $raw    = $perDay * (int) $action->n_days;
                    $discountRent += $applyCap($raw);
                }
                break;

            case PromotionActionType::FIRST_N_PERIODS_PERCENT:
                if ($action->n_periods && $eligiblePeriodIndex <= (int) $action->n_periods) {
                    if ($action->applies_to_rent) {
                        $discountRent += $applyPercent($baseRent, (int) $action->percent_bps);
                    }
                    if ($action->applies_to_deposit) {
                        $discountDep += $applyPercent($baseDeposit, (int) $action->percent_bps);
                    }
                }
                break;

            case PromotionActionType::FIRST_N_PERIODS_AMOUNT:
                if ($action->n_periods && $eligiblePeriodIndex <= (int) $action->n_periods) {
                    if ($action->applies_to_rent) {
                        $discountRent += $applyAmount($baseRent, (int) $action->amount_idr);
                    }
                    if ($action->applies_to_deposit) {
                        $discountDep += $applyAmount($baseDeposit, (int) $action->amount_idr);
                    }
                }
                break;
        }

        return [
            'discount_rent'    => (int) $discountRent,
            'discount_deposit' => (int) $discountDep,
        ];
    }
}
