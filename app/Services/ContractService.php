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
                $room   = Room::query()->whereKey($data['room_id'])->lockForUpdate()->firstOrFail();
                $tenant = User::findOrFail($data['user_id']);

                $start            = Carbon::parse($data['start_date'])->startOfDay();
                $period           = (string) $data['billing_period'];
                $duration         = isset($data['duration_count']) ? (int) $data['duration_count'] : null;
                $end              = null;
                $prorata          = AppSetting::config('billing.prorata', false);
                $autoRenewDefault = AppSetting::config('contract.auto_renew_default', false);
                $status           = ContractStatus::PENDING_PAYMENT;

                if ($period === BillingPeriod::DAILY->value) {
                    $duration = max(1, $duration ?? 1);
                    $end      = $start->copy()->addDays($duration)->subDay()->toDateString();
                } elseif ($period === BillingPeriod::WEEKLY->value) {
                    $duration = max(1, $duration ?? 1);
                    $end      = $start->copy()->addWeeks($duration)->subDay()->toDateString();
                } elseif ($period === BillingPeriod::MONTHLY->value) {
                    $end = Contract::monthlyEndDate($start, (int) max(1, $duration ?? 1), (bool) $prorata);
                } else {
                    $daysMap = BillingPeriod::units();
                    $days    = (int) ($daysMap[(string) $data['billing_period']] ?? 30);
                    $end     = $start->copy()->addDays($days)->subDay()->toDateString();
                }

                $leadDays    = (int) AppSetting::config('contract.prebook_lead_days', 7);
                $today       = now()->startOfDay();
                $computedEnd = Carbon::parse($end)->startOfDay();

                $hasOverlap = Contract::query()
                    ->where('room_id', $room->id)
                    ->whereIn('status', [
                        ContractStatus::PENDING_PAYMENT->value,
                        ContractStatus::BOOKED->value,
                        ContractStatus::ACTIVE->value,
                    ])
                    ->where(function ($q) use ($start, $computedEnd) {
                        $q->whereDate('start_date', '<=', $computedEnd->toDateString())
                            ->whereDate('end_date', '>=', $start->toDateString());
                    })
                    ->exists();
                if ($hasOverlap) {
                    throw new \RuntimeException(__('management/contracts.errors.schedule_conflict'));
                }

                $activeNow = Contract::query()
                    ->where('room_id', $room->id)
                    ->where('status', ContractStatus::ACTIVE->value)
                    ->orderByDesc('end_date')
                    ->first();
                if ($activeNow) {
                    $activeEnd = $activeNow->end_date ? $activeNow->end_date->copy()->startOfDay() : null;
                    $renewOff  = !$activeNow->auto_renew || !empty($activeNow->renewal_cancelled_at);

                    if (!$activeEnd) {
                        throw new \RuntimeException(__('management/contracts.errors.active_missing_end_date'));
                    }

                    if (!$start->greaterThan($activeEnd)) {
                        throw new \RuntimeException(__('management/contracts.errors.start_must_be_after_active_end'));
                    }

                    $withinWindow = $activeEnd->lessThanOrEqualTo($today->copy()->addDays(max(1, $leadDays)));
                    if (!$renewOff || !$withinWindow) {
                        throw new \RuntimeException(__('management/contracts.errors.cannot_prebook_yet', ['days' => (int) $leadDays]));
                    }

                    $hasFutureHolder = Contract::query()
                        ->where('room_id', $room->id)
                        ->whereIn('status', [
                            ContractStatus::PENDING_PAYMENT->value,
                            ContractStatus::BOOKED->value,
                            ContractStatus::ACTIVE->value,
                        ])
                        ->whereDate('start_date', '>', $today->toDateString())
                        ->exists();
                    if ($hasFutureHolder) {
                        throw new \RuntimeException(__('management/contracts.errors.future_booking_exists'));
                    }
                }

                if ($period === BillingPeriod::MONTHLY->value) {
                    if ($prorata) {
                        $releaseDom = AppSetting::config('billing.release_day_of_month', 1);
                        $billingDay = max(1, min(31, (int) $releaseDom));
                    } else {
                        $billingDay = (int) $start->day;
                    }
                } else {
                    $billingDay = null;
                }

                $autoRenew = array_key_exists('auto_renew', $data)
                    ? (bool) $data['auto_renew']
                    : $autoRenewDefault;

                $seq            = self::nextGlobalContractSequence();
                $datePart       = $start->format('Ymd');
                $seqPart        = sprintf('%04d', $seq);
                $roomPart       = (string) $room->number;
                $contractNumber = $datePart . '-' . $seqPart . '-' . $roomPart;

                $payloadRent            = isset($data['rent_idr']) ? (int) $data['rent_idr'] : 0;
                $payloadDeposit         = isset($data['deposit_idr']) ? (int) $data['deposit_idr'] : 0;
                $effectiveRoomRentCents = (int) ($room->effectivePriceCents($period) ?? 0);
                $effectiveRoomDepCents  = (int) ($room->effectiveDepositCents($period) ?? 0);
                $fallbackRentRupiah     = (int) $effectiveRoomRentCents;
                $fallbackDepositRupiah  = (int) $effectiveRoomDepCents;
                $finalRent              = $payloadRent > 0 ? $payloadRent : $fallbackRentRupiah;
                $finalDeposit           = $payloadDeposit > 0 ? $payloadDeposit : $fallbackDepositRupiah;

                $contract = Contract::create([
                    'number'         => $contractNumber,
                    'user_id'        => $tenant->id,
                    'room_id'        => $room->id,
                    'start_date'     => $start->toDateString(),
                    'end_date'       => $end,
                    'rent_idr'       => $finalRent,
                    'deposit_idr'    => $finalDeposit,
                    'billing_period' => $data['billing_period'],
                    'billing_day'    => $billingDay,
                    'auto_renew'     => $autoRenew,
                    'status'         => $status,
                    'notes'          => $data['notes'] ?? null,
                ]);

                $mode = (string) ($data['monthly_payment_mode'] ?? 'per_month');
                if ($period === BillingPeriod::MONTHLY->value && $mode === 'full') {
                    $this->invoices->generate($contract, ['full' => true, 'include_deposit' => true]);
                } else {
                    $this->generateInitialInvoice($contract);
                }

                if ($room->status->value !== RoomStatus::OCCUPIED->value && $room->status->value !== RoomStatus::RESERVED->value) {
                    $room->update(['status' => RoomStatus::RESERVED->value]);
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

    /**
     * Atomically increment and return the next global contract sequence number.
     */
    protected static function nextGlobalContractSequence(): int
    {
        return DB::transaction(function () {
            $row = AppSetting::query()
                ->where('key', 'contract.global_sequence')
                ->lockForUpdate()
                ->first();

            if (!$row) {
                $row = new AppSetting([
                    'key'   => 'contract.global_sequence',
                    'type'  => 'int',
                    'value' => 0,
                ]);
                $row->save();
            }

            $current = (int) ($row->getAttribute('value') ?? 0);
            $next    = $current + 1;
            $row->setAttribute('value', $next);
            $row->type = 'int';
            $row->save();

            return $next;
        });
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

                $room = $contract->room()->first();
                /** @var \App\Models\Room|null $room */
                if ($room instanceof \App\Models\Room) {
                    $this->recomputeRoomStatus($room);
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

    public function generateInitialInvoice(Contract $contract): void
    {
        try {
            // If any invoice exists already, do nothing
            $hasAny = $contract->invoices()->exists();
            if ($hasAny) {
                return;
            }

            $this->invoices->generate($contract, ['first' => true]);
        } catch (\Throwable $e) {
            Log::error('ContractService::generateInitialInvoice failed', [
                'contract_id' => $contract->id,
                'error'       => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function complete(Contract $contract): void
    {
        try {
            DB::transaction(function () use ($contract): void {
                $contract->forceFill([
                    'status'     => ContractStatus::COMPLETED,
                    'auto_renew' => false,
                ])->save();

                $room = $contract->room()->first();
                /** @var \App\Models\Room|null $room */
                if ($room instanceof \App\Models\Room) {
                    $this->recomputeRoomStatus($room);
                }
            });
        } catch (\Throwable $e) {
            Log::error('ContractService::complete failed', [
                'error'       => $e->getMessage(),
                'trace'       => $e->getTraceAsString(),
                'contract_id' => $contract->id,
            ]);
            throw $e;
        }
    }

    /**
     * Recompute and update the room status based on current contracts.
     * Priority: Active => OCCUPIED; else if Pending/Booked/Paid exists => RESERVED; else VACANT.
     */
    private function recomputeRoomStatus(Room $room): void
    {
        $hasActive = Contract::query()
            ->where('room_id', $room->id)
            ->where('status', ContractStatus::ACTIVE->value)
            ->exists();

        if ($hasActive) {
            if ($room->status->value !== RoomStatus::OCCUPIED->value) {
                $room->update(['status' => RoomStatus::OCCUPIED->value]);
            }

            return;
        }

        $hasHolder = Contract::query()
            ->where('room_id', $room->id)
            ->whereIn('status', [
                ContractStatus::PENDING_PAYMENT->value,
                ContractStatus::BOOKED->value,
            ])
            ->exists();

        $target = $hasHolder ? RoomStatus::RESERVED->value : RoomStatus::VACANT->value;
        if ($room->status->value !== $target) {
            $room->update(['status' => $target]);
        }
    }
}
