<?php

namespace App\Console\Commands;

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Services\Contracts\ContractServiceInterface;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ContractsAutoRenewDue extends Command
{
    protected $signature = 'contracts:auto-renew-due
        {--chunk=200 : Chunk size for processing}
        {--dry-run : Only show counts without updating}';

    protected $description = 'Auto-renew contracts by duplicating them into a new contract when due (with deposit rollover and prorata logic).';

    public function handle(ContractServiceInterface $contracts): int
    {
        $chunk  = (int) $this->option('chunk');
        $dryRun = (bool) $this->option('dry-run');
        $today  = Carbon::now()->startOfDay();

        $leadDays      = (int) AppSetting::config('contract.auto_renew_lead_days', 7);
        $effectiveLead = max(1, $leadDays);

        $rollover = (bool) AppSetting::config('billing.deposit_renewal_rollover', true);

        $countCreated = 0;
        $countSkipped = 0;

        Contract::query()
            ->select(['id'])
            ->where('auto_renew', true)
            ->where('status', ContractStatus::ACTIVE->value)
            ->whereDate('end_date', '<=', $today->copy()->addDays($effectiveLead)->toDateString())
            ->orderBy('id')
            ->chunkById($chunk, function ($rows) use (&$countCreated, &$countSkipped, $contracts, $today, $dryRun, $rollover): void {
                $ids = collect($rows)->pluck('id')->all();
                if (empty($ids)) {
                    return;
                }

                /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Contract> $batch */
                $batch = Contract::query()
                    ->whereIn('id', $ids)
                    ->with(['room:id,room_type_id,price_overrides', 'room.type:id,prices', 'tenant:id'])
                    ->get();

                foreach ($batch as $old) {
                    $start = $old->end_date ? $old->end_date->copy()->addDay()->toDateString() : $today->copy()->toDateString();

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
                        $countSkipped++;
                        continue;
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

                    if ($dryRun) {
                        $countCreated++;
                        continue;
                    }

                    try {
                        $contracts->create($payload);
                        $countCreated++;

                        $contracts->complete($old);
                    } catch (\Throwable $e) {
                        $countSkipped++;
                    }
                }
            });

        $prefix = $dryRun ? '[dry-run] ' : '';
        $this->info($prefix . "Auto-renew created={$countCreated}, skipped={$countSkipped}.");

        return self::SUCCESS;
    }

    /**
     * @return array{0:string,1:int} [billing_period,duration]
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
}
