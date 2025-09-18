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
                $room = Room::query()->whereKey($data['room_id'])->lockForUpdate()->firstOrFail();
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

                // Guard: prevent overlaps and enforce pre-booking rules
                $leadDays    = (int) AppSetting::config('contract.prebook_lead_days', 7);
                $today       = now()->startOfDay();
                $computedEnd = Carbon::parse($end)->startOfDay();

                // 1) No overlapping with any holding contract on the same room
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
                    throw new \RuntimeException('Jadwal kamar bentrok dengan kontrak lain.');
                }

                // 2) If room is currently occupied, only allow pre-book within lead days and start AFTER current end_date
                //    Also ensure no future holder already exists.
                $activeNow = Contract::query()
                    ->where('room_id', $room->id)
                    ->where('status', ContractStatus::ACTIVE->value)
                    ->orderByDesc('end_date')
                    ->first();
                if ($activeNow) {
                    $activeEnd = $activeNow->end_date ? $activeNow->end_date->copy()->startOfDay() : null;
                    $renewOff  = !$activeNow->auto_renew || !empty($activeNow->renewal_cancelled_at);

                    if (!$activeEnd) {
                        throw new \RuntimeException('Tidak dapat memesan: kontrak aktif tidak memiliki tanggal berakhir.');
                    }

                    // Start must be strictly after current end
                    if (!$start->greaterThan($activeEnd)) {
                        throw new \RuntimeException('Tanggal mulai harus setelah tanggal berakhir kontrak saat ini.');
                    }

                    // Must be within lead days window and auto_renew disabled
                    $withinWindow = $activeEnd->lessThanOrEqualTo($today->copy()->addDays(max(1, $leadDays)));
                    if (!$renewOff || !$withinWindow) {
                        throw new \RuntimeException('Kamar belum dapat dipesan saat ini. Hanya dapat dipesan 7 hari sebelum kontrak berakhir jika auto‑renew nonaktif.');
                    }

                    // Ensure no other future holder already exists
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
                        throw new \RuntimeException('Kamar sudah memiliki pemesanan berikutnya.');
                    }
                }

                // Decide billing day (ignore payload; compute)
                if ($period === BillingPeriod::MONTHLY->value) {
                    // If prorata is enabled, align to global release day to keep cycles consistent.
                    // Otherwise, keep billing day as start date's day (no prorata path).
                    if ($prorata) {
                        $releaseDom = AppSetting::config('billing.release_day_of_month', 1);
                        $billingDay = max(1, min(31, (int) $releaseDom));
                    } else {
                        $billingDay = (int) $start->day;
                    }
                } else {
                    $billingDay = (int) $start->day;
                }

                $autoRenew = array_key_exists('auto_renew', $data)
                    ? (bool) $data['auto_renew']
                    : $autoRenewDefault;

                $seq            = self::nextGlobalContractSequence();
                $datePart       = $start->format('Ymd');
                $seqPart        = sprintf('%04d', $seq);
                $roomPart       = (string) $room->number;
                $contractNumber = $datePart . '-' . $seqPart . '-' . $roomPart;

                $contract = Contract::create([
                    'number'         => $contractNumber,
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

                // Generate initial invoice via shared helper
                $this->generateInitialInvoice($contract);

                // Initial creation sets status to PENDING_PAYMENT.
                // Set room to RESERVED only if it's not currently OCCUPIED (avoid downgrading an occupied room)
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
            /** @var \App\Models\AppSetting|null $row */
            $row = \App\Models\AppSetting::query()
                ->where('key', 'contract.global_sequence')
                ->lockForUpdate()
                ->first();

            if (!$row) {
                $row = new \App\Models\AppSetting([
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

                /** @var Room|null $room */
                $room = $contract->room()->first();
                if ($room) {
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

                /** @var Room|null $room */
                $room = $contract->room()->first();
                if ($room) {
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
