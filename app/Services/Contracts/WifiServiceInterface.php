<?php

namespace App\Services\Contracts;

use App\Models\User;
use App\Models\WifiSession;

interface WifiServiceInterface
{
    /** Pilih WifiPolicy aktif berdasarkan role user (Spatie) + fallback default */
    public function selectPolicyForUser(User $user): ?\App\Models\WifiPolicy;

    /**
     * Hitung total bytes (incoming+outgoing) user pada window waktu [start, end).
     * Agregasi lintas sesi (PostgreSQL optimized).
     */
    public function aggregateUserBytes(int $userId, \Carbon\CarbonImmutable $start, \Carbon\CarbonImmutable $end): int;

    /**
     * Evaluasi kelayakan sesi (apply hard_cap + windows dari policy->quota JSONB).
     * return: ['allowed'=>bool, 'reason'=>string, 'windowsUsage'=>['daily'=>['limit'=>?,'used'=>?], ...]].
     */
    public function evaluateSession(WifiSession $session): array;
}
