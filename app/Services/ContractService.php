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

                // Generate invoice(s) according to billing period and plan
                $this->invoices->createInitialInvoices($contract, $data);

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
                $today = now()->startOfDay()->toDateString();

                $contract->invoices()
                    ->where('status', InvoiceStatus::PENDING->value)
                    ->where('due_date', '<', $today)
                    ->update(['status' => InvoiceStatus::OVERDUE->value]);

                $contract->forceFill(['status' => ContractStatus::OVERDUE])->save();
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

    public function extendDue(Contract $contract, string $dueDate): ?Invoice
    {
        try {
            return DB::transaction(function () use ($contract, $dueDate): ?Invoice {
                /** @var Invoice|null $invoice */
                $invoice = $contract->invoices()
                    ->whereIn('status', [InvoiceStatus::PENDING->value, InvoiceStatus::OVERDUE->value])
                    ->orderByDesc('due_date')
                    ->first();

                if (!$invoice) {
                    return null;
                }

                $newDue            = Carbon::parse($dueDate)->startOfDay();
                $invoice->due_date = $newDue;

                $today = Carbon::now()->startOfDay();
                if ($newDue->greaterThanOrEqualTo($today)) {
                    if ($invoice->status === InvoiceStatus::OVERDUE) {
                        $invoice->status = InvoiceStatus::PENDING;
                    }
                    $contract->status = ContractStatus::PENDING_PAYMENT;
                    $contract->save();
                    if ($contract->room) {
                        $contract->room->update(['status' => RoomStatus::RESERVED->value]);
                    }
                }

                $invoice->save();

                return $invoice;
            });
        } catch (\Throwable $e) {
            Log::error('ContractService::extendDue failed', [
                'error'       => $e->getMessage(),
                'trace'       => $e->getTraceAsString(),
                'contract_id' => $contract->id,
                'due_date'    => $dueDate,
            ]);
            throw $e;
        }
    }

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
