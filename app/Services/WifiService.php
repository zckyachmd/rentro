<?php

namespace App\Services;

use App\Models\User;
use App\Models\WifiPolicy;
use App\Models\WifiSession;
use App\Services\Contracts\WifiServiceInterface;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class WifiService implements WifiServiceInterface
{
    public function selectPolicyForUser(User $user): ?WifiPolicy
    {
        // Ambil semua role user (Spatie)
        $userRoles = $user->getRoleNames()->toArray(); // ["Tenant", "Manager", ...]

        // Cari policy aktif yang meta->roles mengandung salah satu role user.
        // Postgres: jsonb operators bisa dipakai; tapi pakai query builder aman lintas driver.
        return WifiPolicy::query()
            ->where('is_active', true)
            ->where(function ($q) use ($userRoles) {
                $q->whereNull('meta->roles')
                    ->orWhereRaw("jsonb_exists_any(meta->'roles', ?::text[])", ['{' . implode(',', array_map(fn ($r) => '"' . $r . '"', $userRoles)) . '}']);
            })
            ->orderBy('id')
            ->first()
            ?? WifiPolicy::where('is_active', true)->orderBy('id')->first();
    }

    public function aggregateUserBytes(int $userId, CarbonImmutable $start, CarbonImmutable $end): int
    {
        // Strategy: counters simpan nilai kumulatif; ambil (MAX - MIN) per session di window lalu SUM.
        // Postgres SQL manual via DB::selectOne untuk performa.
        $row = DB::selectOne(<<<SQL
WITH per_session AS (
  SELECT
    c.session_id,
    GREATEST(MAX(c.incoming) - MIN(c.incoming), 0)::bigint AS in_delta,
    GREATEST(MAX(c.outgoing) - MIN(c.outgoing), 0)::bigint AS out_delta
  FROM wifi_counters c
  JOIN wifi_sessions s ON s.id = c.session_id
  WHERE s.user_id = :user_id
    AND c.ts >= :start
    AND c.ts <  :end
  GROUP BY c.session_id
)
SELECT COALESCE(SUM(in_delta + out_delta), 0)::bigint AS bytes
FROM per_session;
SQL, [
            'user_id' => $userId,
            'start'   => $start->toDateTimeString(),
            'end'     => $end->toDateTimeString(),
        ]);

        // Using -> with ?? is safe here; selectOne may return null but ?? handles it
        return (int) ($row->bytes ?? 0);
    }

    public function evaluateSession(WifiSession $session): array
    {
        /** @var WifiPolicy|null $policy */
        $policy = $session->policy;
        if (!$policy || !$policy->is_active) {
            return ['allowed' => false, 'reason' => 'no_policy_or_inactive', 'windowsUsage' => []];
        }

        // Legacy total per-session (opsional): block jika quota_bytes terisi dan sesi ini sudah melebihi.
        if (!is_null($policy->quota_bytes)) {
            $total = (int) $session->bytes_in + (int) $session->bytes_out;
            if ($total >= (int) $policy->quota_bytes) {
                return ['allowed' => false, 'reason' => 'exceeded:total', 'windowsUsage' => [
                    'total' => ['limit' => (int) $policy->quota_bytes, 'used' => $total],
                ]];
            }
        }

        $quota   = $policy->quota ?? [];
        $windows = $quota['windows'] ?? [];
        $hardCap = (bool) ($quota['hard_cap'] ?? true);

        $now          = CarbonImmutable::now();
        $windowsUsage = [];
        $exceeded     = [];

        $computeRange = function (array $cfg) use ($now): ?array {
            if (!array_key_exists('bytes', $cfg) || is_null($cfg['bytes'])) {
                return null;
            }

            if (isset($cfg['reset_every_days'])) {
                $d = max(1, (int) $cfg['reset_every_days']);

                return [$now->subDays($d), $now, (int) $cfg['bytes']];
            }
            if (isset($cfg['reset_every_weeks'])) {
                $w = max(1, (int) $cfg['reset_every_weeks']);

                return [$now->subWeeks($w), $now, (int) $cfg['bytes']];
            }
            if (isset($cfg['reset_every_months'])) {
                $m = max(1, (int) $cfg['reset_every_months']);

                return [$now->subMonths($m), $now, (int) $cfg['bytes']];
            }

            // fallback: 1 hari
            return [$now->subDay(), $now, (int) $cfg['bytes']];
        };

        foreach (['daily', 'weekly', 'monthly'] as $key) {
            if (!isset($windows[$key])) {
                continue;
            }
            $cfg   = $windows[$key];
            $range = $computeRange($cfg);
            if (!$range) {
                continue;
            }

            [$start, $end, $limit] = $range;
            // Agregasi lintas sesi milik user (lebih adil jika 1 user punya beberapa device)
            $used = $this->aggregateUserBytes($session->user_id, $start, $end);

            $windowsUsage[$key] = ['limit' => $limit, 'used' => $used];
            if ($used >= $limit) {
                $exceeded[] = $key;
            }
        }

        if ($hardCap && $exceeded) {
            return ['allowed' => false, 'reason' => 'exceeded:' . implode(',', $exceeded), 'windowsUsage' => $windowsUsage];
        }

        return ['allowed' => true, 'reason' => 'ok', 'windowsUsage' => $windowsUsage];
    }
}
