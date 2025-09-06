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
use Illuminate\Support\Facades\Log;

class ContractService implements ContractServiceInterface
{
    public function __construct(private InvoiceServiceInterface $invoices)
    {
    }

    public function create(array $data): Contract
    {
        try {
            return DB::transaction(function () use ($data) {
                /** @var Room $room */
                $room = Room::findOrFail($data['room_id']);
                /** @var User $tenant */
                $tenant = User::findOrFail($data['user_id']);

                $start            = Carbon::parse($data['start_date'])->startOfDay();
                $period           = (string) $data['billing_period'];
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
                    $days    = (int) ($daysMap[(string) $data['billing_period']] ?? 30);
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

                // Generate initial invoice using the new general API for predictability.
                // Strategy:
                // - First invoice includes deposit and (when applicable) prorata based on app settings.
                // - For Monthly contracts: first invoice covers prorata (jika perlu) + 1 bulan penuh.
                // - For Daily/Weekly: first invoice menagih sisa durasi awal kontrak.
                // - InvoiceService::generate() will guard overlaps.
                try {
                    $this->invoices->generate($contract, ['first' => true]);
                } catch (\Throwable $e) {
                    // Log and rethrow to surface error to controller layer
                    Log::error('Initial invoice generation failed', [
                        'contract_id' => $contract->id,
                        'error'       => $e->getMessage(),
                    ]);
                    throw $e;
                }

                // Initial creation sets status to PENDING_PAYMENT → room becomes RESERVED
                $newRoomStatus = RoomStatus::RESERVED->value;

                if ($newRoomStatus !== $room->status) {
                    $room->update(['status' => $newRoomStatus]);
                }

                return $contract;
            });
        } catch (\Throwable $e) {
            Log::error('ContractService::create failed', [
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
                'payload' => $data,
            ]);
            throw $e;
        }
    }

    public function markOverdue(Contract $contract): void
    {
        try {
            DB::transaction(function () use ($contract): void {
                $todayDate = now()->startOfDay()->toDateString();
                $now       = now();

                $contract->invoices()
                    ->where('status', InvoiceStatus::PENDING->value)
                    ->where('due_date', '<', $todayDate)
                    ->update([
                        'status'     => InvoiceStatus::OVERDUE->value,
                        'updated_at' => $now,
                    ]);

                if ($contract->status !== ContractStatus::OVERDUE) {
                    $contract->forceFill(['status' => ContractStatus::OVERDUE]);
                    $contract->save();
                }
            });
        } catch (\Throwable $e) {
            Log::error('ContractService::markOverdue failed', [
                'error'       => $e->getMessage(),
                'trace'       => $e->getTraceAsString(),
                'contract_id' => $contract->id,
            ]);
            throw $e;
        }
    }

    // extendDue moved to InvoiceService

    public function cancel(Contract $contract): void
    {
        try {
            DB::transaction(function () use ($contract): void {
                $cancelInvoiceIds = $contract->invoices()
                    ->whereIn('status', [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value])
                    ->whereDoesntHave('payments', function ($q) {
                        $q->where('status', PaymentStatus::COMPLETED->value);
                    })
                    ->pluck('id');

                if ($cancelInvoiceIds->isNotEmpty()) {
                    Invoice::query()->whereIn('id', $cancelInvoiceIds)->update([
                        'status' => InvoiceStatus::CANCELLED->value,
                    ]);
                }

                $allInvoiceIds = $contract->invoices()->pluck('id');

                if ($allInvoiceIds->isNotEmpty()) {
                    Payment::query()
                        ->whereIn('invoice_id', $allInvoiceIds)
                        ->where('status', PaymentStatus::PENDING->value)
                        ->update(['status' => PaymentStatus::CANCELLED->value]);
                }

                $contract->forceFill([
                    'auto_renew'           => false,
                    'renewal_cancelled_at' => now(),
                    'status'               => ContractStatus::CANCELLED,
                ])->save();

                /** @var Room|null $room */
                $room = $contract->room()
                    ->withCount(['holdingContracts as other_holders_count' => function ($q) use ($contract) {
                        $q->where('id', '!=', $contract->id);
                    }])
                    ->first();

                if ($room && (int) ($room->getAttribute('other_holders_count') ?? 0) === 0) {
                    $room->update(['status' => RoomStatus::VACANT->value]);
                }
            });
        } catch (\Throwable $e) {
            Log::error('ContractService::cancel failed', [
                'error'       => $e->getMessage(),
                'trace'       => $e->getTraceAsString(),
                'contract_id' => $contract->id,
            ]);
            throw $e;
        }
    }

    public function setAutoRenew(Contract $contract, bool $enabled): void
    {
        try {
            DB::transaction(function () use ($contract, $enabled): void {
                $contract->forceFill([
                    'auto_renew'           => $enabled,
                    'renewal_cancelled_at' => $enabled ? null : now(),
                ])->save();
            });
        } catch (\Throwable $e) {
            Log::error('ContractService::setAutoRenew failed', [
                'error'       => $e->getMessage(),
                'trace'       => $e->getTraceAsString(),
                'contract_id' => $contract->id,
                'enabled'     => $enabled,
            ]);
            throw $e;
        }
    }
}
