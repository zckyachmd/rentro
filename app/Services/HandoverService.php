<?php

namespace App\Services;

use App\Enum\ContractStatus;
use App\Enum\RoomStatus;
use App\Models\AppSetting;
use App\Models\Contract;
use App\Models\RoomHandover;
use App\Services\Contracts\ContractServiceInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HandoverService
{
    public function __construct(private readonly ContractServiceInterface $contracts)
    {
    }

    /**
     * Buat handover check-in.
     * @param array{notes?:string,items?:array<string,mixed>} $payload
     */
    public function checkin(Contract $contract, array $payload = []): RoomHandover
    {
        $today = now()->startOfDay();
        // Aturan izin check-in tergantung konfigurasi
        // - Jika require_checkin_for_activate = true: hanya izinkan kontrak Booked (tanggal mulai sudah tiba)
        // - Jika false: kontrak boleh check-in saat Booked maupun Active (retroaktif)
        $requireCheckinForActivate = (bool) \App\Models\AppSetting::config('handover.require_checkin_for_activate', true);
        $allowedStatuses           = $requireCheckinForActivate
            ? [ContractStatus::BOOKED->value]
            : [ContractStatus::BOOKED->value, ContractStatus::ACTIVE->value];

        $allowActiveDisputedRedo = false;
        if ($contract->status->value === ContractStatus::ACTIVE->value) {
            $lastCheckin = $contract
                ->hasMany(RoomHandover::class, 'contract_id')
                ->where('type', 'checkin')
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->first();
            $allowActiveDisputedRedo = $lastCheckin && (string) $lastCheckin->status === 'Disputed';
        }

        if (!in_array($contract->status->value, $allowedStatuses, true) && !$allowActiveDisputedRedo) {
            throw new \RuntimeException('Kontrak tidak valid untuk check-in.');
        }
        if ($contract->status->value === ContractStatus::BOOKED->value) {
            if ($contract->start_date && $contract->start_date->copy()->startOfDay()->greaterThan($today)) {
                throw new \RuntimeException('Tanggal mulai kontrak belum tiba.');
            }
        }

        $hasActiveCheckin = $contract
            ->hasMany(RoomHandover::class, 'contract_id')
            ->where('type', 'checkin')
            ->whereIn('status', ['Pending', 'Confirmed'])
            ->exists();
        if ($hasActiveCheckin) {
            throw new \RuntimeException('Masih ada check-in yang menunggu konfirmasi tenant.');
        }

        return $this->createHandoverWithItems($contract, 'checkin', $payload);
    }

    /**
     * Buat handover check-out.
     * @param array{notes?:string,items?:array<string,mixed>} $payload
     */
    public function checkout(Contract $contract, array $payload = []): RoomHandover
    {
        $statusVal              = $contract->status->value;
        $isActive               = $statusVal === ContractStatus::ACTIVE->value;
        $isCompleted            = $statusVal === ContractStatus::COMPLETED->value;
        $allowCompletedDisputed = false;
        if ($isCompleted) {
            $lastCheckout = $contract
                ->hasMany(RoomHandover::class, 'contract_id')
                ->where('type', 'checkout')
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->first();
            $allowCompletedDisputed = $lastCheckout && (string) $lastCheckout->status === 'Disputed';
        }
        if (!$isActive && !$allowCompletedDisputed) {
            throw new \RuntimeException('Kontrak tidak valid untuk check-out.');
        }
        $hasConfirmedCheckin = $contract
            ->hasMany(RoomHandover::class, 'contract_id')
            ->where('type', 'checkin')
            ->where('status', 'Confirmed')
            ->exists();
        if (!$hasConfirmedCheckin) {
            throw new \RuntimeException('Belum ada check-in yang terkonfirmasi. Ulangi proses check-in dan pastikan tenant menyetujui.');
        }
        $hasCheckout = $contract
            ->hasMany(RoomHandover::class, 'contract_id')
            ->where('type', 'checkout')
            ->whereIn('status', ['Pending', 'Confirmed'])
            ->exists();
        if ($hasCheckout) {
            throw new \RuntimeException('Check-out sudah dibuat.');
        }

        return $this->createHandoverWithItems($contract, 'checkout', $payload);
    }

    /**
     * Helper: Buat handover sederhana berbasis naratif tanpa checklist.
     */
    protected function createHandoverWithItems(Contract $contract, string $type, array $payload): RoomHandover
    {
        try {
            return DB::transaction(function () use ($contract, $type, $payload): RoomHandover {
                /** @var \App\Models\Contract $contract */
                $contract = Contract::query()->whereKey($contract->id)->lockForUpdate()->firstOrFail();

                if ($type === 'checkin') {
                    $hasActiveCheckin = $contract
                        ->hasMany(RoomHandover::class, 'contract_id')
                        ->where('type', 'checkin')
                        ->whereIn('status', ['Pending', 'Confirmed'])
                        ->exists();
                    if ($hasActiveCheckin) {
                        throw new \RuntimeException('Masih ada check-in yang menunggu konfirmasi tenant.');
                    }
                } elseif ($type === 'checkout') {
                    $hasConfirmedCheckin = $contract
                        ->hasMany(RoomHandover::class, 'contract_id')
                        ->where('type', 'checkin')
                        ->where('status', 'Confirmed')
                        ->exists();
                    if (!$hasConfirmedCheckin) {
                        throw new \RuntimeException('Belum ada check-in yang terkonfirmasi. Ulangi proses check-in dan pastikan tenant menyetujui.');
                    }
                    $hasCheckout = $contract
                        ->hasMany(RoomHandover::class, 'contract_id')
                        ->where('type', 'checkout')
                        ->whereIn('status', ['Pending', 'Confirmed'])
                        ->exists();
                    if ($hasCheckout) {
                        throw new \RuntimeException('Check-out sudah dibuat.');
                    }
                }

                $notes = (string) ($payload['notes'] ?? '');

                $handover = RoomHandover::create([
                    'contract_id' => $contract->id,
                    'type'        => $type,
                    'status'      => 'Pending',
                    'notes'       => $notes ?: null,
                ]);

                $contract->refresh();

                $requireTenantAck = (bool) AppSetting::config('handover.require_tenant_ack_for_activate', false);
                if (!$requireTenantAck) {
                    if ($contract->status->value !== ContractStatus::ACTIVE->value) {
                        $contract->forceFill(['status' => ContractStatus::ACTIVE])->save();
                    }
                }
                /** @var \App\Models\Room|null $room */
                $room = $contract->room;
                if (!$requireTenantAck) {
                    if ($room && $room->status->value !== RoomStatus::OCCUPIED->value) {
                        $room->update(['status' => RoomStatus::OCCUPIED->value]);
                    }
                }

                if ($type === 'checkout') {
                    $requireCheckoutComplete     = (bool) AppSetting::config('handover.require_checkout_for_complete', true);
                    $requireTenantAckForComplete = (bool) AppSetting::config('handover.require_tenant_ack_for_complete', false);

                    if (!$requireCheckoutComplete) {
                        if (!$requireTenantAckForComplete) {
                            $this->contracts->complete($contract);
                        }
                    } elseif (!$requireTenantAckForComplete) {
                        $this->contracts->complete($contract);
                    }
                }

                return $handover;
            });
        } catch (\Throwable $e) {
            Log::error('HandoverService::create failed', [
                'contract_id' => $contract->id,
                'type'        => $type,
                'error'       => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
