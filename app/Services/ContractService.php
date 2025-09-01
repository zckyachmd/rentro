<?php

namespace App\Services;

use App\Enum\BillingPeriod;
use App\Enum\ContractStatus;
use App\Enum\InvoiceStatus;
use App\Enum\PaymentStatus;
use App\Enum\RoomStatus;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Room;
use App\Models\User;
use App\Services\Contracts\ContractServiceInterface;
use App\Services\Contracts\InvoiceServiceInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ContractService implements ContractServiceInterface
{
    public function __construct(private InvoiceServiceInterface $invoices)
    {
    }

    /**
     * Create a new contract and its initial invoice(s) in a single DB transaction.
     *
     * Flow:
     *  - Load & validate settings (duration limits, allowed monthly terms)
     *  - Derive end_date & billing_day (respecting prorata rules)
     *  - Create Contract record
     *  - Generate initial invoice(s) based on billing_period & payment plan
     *
     * @param array<string,mixed> $data Validated payload from controller
     * @return Contract
     */
    public function create(array $data): Contract
    {
        return DB::transaction(function () use ($data) {
            /** @var Room $room */
            $room = Room::findOrFail($data['room_id']);
            /** @var User $tenant */
            $tenant = User::findOrFail($data['user_id']);

            $start            = Carbon::parse($data['start_date'])->startOfDay();
            $period           = strtolower((string) $data['billing_period']);
            $duration         = isset($data['duration_count']) ? (int) $data['duration_count'] : null;
            $end              = null; // always computed
            $prorata          = AppSetting::config('billing.prorata', false);
            $autoRenewDefault = AppSetting::config('contract.auto_renew_default', false);
            $status           = ContractStatus::PENDING_PAYMENT;

            if ($period === BillingPeriod::DAILY->value) {
                $duration = $duration ?? 1;
                $end      = $start->copy()->addDays($duration)->toDateString();
            } elseif ($period === BillingPeriod::WEEKLY->value) {
                $duration = $duration ?? 1;
                $end      = $start->copy()->addWeeks($duration)->toDateString();
            } elseif ($period === BillingPeriod::MONTHLY->value) {
                $end = Contract::monthlyEndDate($start, (int) $duration, (bool) $prorata);
            } else {
                $daysMap = BillingPeriod::units();
                $days    = (int) ($daysMap[strtolower((string) $data['billing_period'])] ?? 30);
                $end     = $start->copy()->addDays($days)->toDateString();
            }

            // Decide billing day (ignore payload; compute)
            $billingDay = $start->day;

            // Align billing day for prorata monthly contracts to global release day
            if ($period === BillingPeriod::MONTHLY->value && $prorata && $start->day !== 1 && ($duration ?? 1) >= 2) {
                $releaseDom = AppSetting::config('billing.release_day_of_month', 1);
                $billingDay = max(1, min(31, $releaseDom));
            }

            $autoRenew = array_key_exists('auto_renew', $data)
                ? (bool) $data['auto_renew']
                : $autoRenewDefault;

            $contract = Contract::create([
                'user_id'        => $tenant->id,
                'room_id'        => $room->id,
                'start_date'     => $start->toDateString(),
                'end_date'       => $end,
                'rent_cents'     => $data['rent_cents'],
                'deposit_cents'  => $data['deposit_cents'] ?? 0,
                'billing_period' => $data['billing_period'],
                'billing_day'    => $billingDay,
                'auto_renew'     => $autoRenew,
                'status'         => $status,
                'notes'          => $data['notes'] ?? null,
            ]);

            // Generate invoice(s) according to billing period and plan
            $this->invoices->createInitialInvoices($contract, $data);

            // Initial creation sets status to PENDING_PAYMENT → room becomes RESERVED
            $newRoomStatus = RoomStatus::RESERVED->value;

            if ($newRoomStatus !== $room->status) {
                $room->update(['status' => $newRoomStatus]);
            }

            return $contract;
        });
    }

    public function cancel(Contract $contract): void
    {
        DB::transaction(function () use ($contract): void {
            if (in_array($contract->status->value, [ContractStatus::CANCELLED->value, ContractStatus::COMPLETED->value], true)) {
                return;
            }

            Invoice::query()
                ->where('contract_id', $contract->id)
                ->whereIn('status', [InvoiceStatus::PENDING->value])
                ->update(['status' => InvoiceStatus::CANCELLED->value]);

            Payment::query()
                ->whereIn('invoice_id', function ($q) use ($contract) {
                    $q->select('id')->from('invoices')->where('contract_id', $contract->id);
                })
                ->where('status', PaymentStatus::PENDING->value)
                ->update(['status' => PaymentStatus::CANCELLED->value]);

            $contract->auto_renew           = false;
            $contract->renewal_cancelled_at = now();
            $contract->status               = ContractStatus::CANCELLED;
            $contract->save();

            // Free the room
            if ($contract->room_id) {
                Room::where('id', $contract->room_id)->update(['status' => RoomStatus::VACANT->value]);
            }
        });
    }
}
