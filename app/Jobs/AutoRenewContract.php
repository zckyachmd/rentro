<?php

namespace App\Jobs;

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Services\Contracts\ContractServiceInterface;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AutoRenewContract implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public int $oldContractId)
    {
        $this->onQueue('contracts');
    }

    public function handle(ContractServiceInterface $contracts): void
    {
        /** @var Contract|null $old */
        $old = Contract::query()->with(['room:id,room_type_id,price_overrides', 'room.type:id,prices', 'tenant:id'])->find($this->oldContractId);
        if (!$old) {
            return;
        }

        if (!$old->auto_renew || $old->status->value !== ContractStatus::ACTIVE->value) {
            return;
        }

        $today    = Carbon::now()->startOfDay();
        $start    = $old->end_date ? $old->end_date->copy()->addDay()->toDateString() : $today->copy()->toDateString();
        $rollover = (bool) AppSetting::config('billing.deposit_renewal_rollover', true);

        $existsFuture = Contract::query()
            ->where('user_id', $old->user_id)
            ->where('room_id', $old->room_id)
            ->whereIn('status', [
                ContractStatus::PENDING_PAYMENT->value,
                ContractStatus::BOOKED->value,
                ContractStatus::ACTIVE->value,
            ])
            ->whereDate('start_date', '>=', $start)
            ->exists();
        if ($existsFuture) {
            return;
        }

        [$period, $duration] = $this->computeTerm($old);

        $deposit   = $rollover ? 0 : (int) ($old->deposit_cents ?? 0);
        $rentCents = (int) $old->rent_cents;

        $payload = [
            'user_id'        => $old->user_id,
            'room_id'        => $old->room_id,
            'start_date'     => $start,
            'billing_period' => $period,
            'duration_count' => $duration,
            'rent_cents'     => $rentCents,
            'deposit_cents'  => $deposit,
            'auto_renew'     => true,
            'notes'          => 'Auto-renewal of contract #' . $old->id,
        ];

        $contracts->create($payload);
        $contracts->complete($old);
    }

    /**
     * @return array{0:string,1:int}
     */
    private function computeTerm(Contract $c): array
    {
        $period = (string) $c->billing_period->value;
        $start  = Carbon::parse($c->start_date)->startOfDay();
        $end    = Carbon::parse($c->end_date)->startOfDay();

        if ($period === BillingPeriod::DAILY->value) {
            $days = max(1, (int) $start->diffInDays($end->copy()->addDay()));

            return [$period, $days];
        }
        if ($period === BillingPeriod::WEEKLY->value) {
            $days  = max(1, (int) $start->diffInDays($end->copy()->addDay()));
            $weeks = max(1, (int) ceil($days / 7));

            return [$period, $weeks];
        }

        $months = 0;
        $cursor = $start->copy();
        while (true) {
            $endOfThis = $cursor->copy()->addMonthNoOverflow()->subDay();
            if ($endOfThis->lessThanOrEqualTo($end)) {
                $months++;
                $cursor = $endOfThis->copy()->addDay();
            } else {
                break;
            }
        }
        $months = max(1, (int) $months);

        return [$period, $months];
    }

    public function tags(): array
    {
        return ['contracts', 'contract:' . $this->oldContractId, 'contract:auto_renew'];
    }
}
