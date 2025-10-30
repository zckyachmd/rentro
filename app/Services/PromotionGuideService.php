<?php

namespace App\Services;

use App\Models\Promotion;
use App\Services\Contracts\PromotionGuideServiceInterface;

class PromotionGuideService implements PromotionGuideServiceInterface
{
    /**
     * Build Cara Penggunaan steps based on promotion scopes, rules, and channel/coupon.
     * @return array<int,string>
     */
    public function buildHowTemplate(Promotion $p): array
    {
        $steps = [];
        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\PromotionRule> $rules */
        $rules  = $p->rules()->get();
        $scopes = $p->scopes()->get();

        // 1) Scope hint
        $scopeHints = [];
        if ($scopes->isNotEmpty()) {
            $buildings = $scopes->where('scope_type', 'building')->pluck('building_id')->filter()->count();
            $floors    = $scopes->where('scope_type', 'floor')->pluck('floor_id')->filter()->count();
            $types     = $scopes->where('scope_type', 'room_type')->pluck('room_type_id')->filter()->count();
            $rooms     = $scopes->where('scope_type', 'room')->pluck('room_id')->filter()->count();
            if ($buildings > 0) {
                $scopeHints[] = 'gedung tertentu';
            }
            if ($floors > 0) {
                $scopeHints[] = 'lantai tertentu';
            }
            if ($types > 0) {
                $scopeHints[] = 'tipe kamar tertentu';
            }
            if ($rooms > 0) {
                $scopeHints[] = 'kamar tertentu';
            }
        }
        $steps[] = 'Pilih kamar' . ($scopeHints ? ' pada ' . implode(', ', $scopeHints) : '') . ' sesuai ketersediaan.';

        // 2) Periods
        $periods = collect($rules)->flatMap(function ($r) {
            $arr = (array) ($r->billing_periods ?? []);

            return array_map('strtolower', $arr);
        })->unique()->values();
        if ($periods->isNotEmpty()) {
            $steps[] = 'Pilih periode sewa: ' . implode(', ', $periods->all()) . '.';
        }

        // 3) Channel/coupon
        if ($p->require_coupon) {
            $code    = $p->coupons()->where('is_active', true)->orderBy('id')->value('code');
            $steps[] = 'Masukkan kode kupon' . ($code ? ': ' . $code : '') . ' pada kolom kupon lalu terapkan.';
        } elseif ($p->default_channel?->value === 'referral') {
            $steps[] = 'Akses halaman melalui tautan referral yang valid agar promo aktif.';
        } elseif ($p->default_channel?->value === 'manual') {
            $steps[] = 'Hubungi admin/manager untuk menerapkan promo pada order Anda.';
        } else {
            $steps[] = 'Promo akan otomatis diterapkan jika syarat terpenuhi.';
        }

        // 4) Time/DoW/Min spend
        $hasTime = false;
        $hasDow  = false;
        $mins    = [];
        foreach ($rules as $r) {
            /** @var \App\Models\PromotionRule $r */
            if (!$hasTime && ($r->time_start || $r->time_end)) {
                $hasTime = true;
                $steps[] = 'Lakukan checkout pada rentang waktu ' . ($r->time_start ?? '00:00') . '–' . ($r->time_end ?? '23:59') . ' sesuai ketentuan.';
            }
            if (!$hasDow && $r->days_of_week) {
                $hasDow  = true;
                $steps[] = 'Promo hanya berlaku pada hari ke-' . implode(',', (array) $r->days_of_week) . ' dalam seminggu.';
            }
            if ($r->min_spend_idr) {
                $mins[] = (int) $r->min_spend_idr;
            }
        }
        if (!empty($mins)) {
            $min     = max($mins);
            $steps[] = 'Pastikan nilai transaksi memenuhi minimal Rp ' . number_format($min, 0, ',', '.') . '.';
        }

        // 5) Finalize
        $steps[] = 'Lanjutkan pembayaran hingga selesai untuk mengaktifkan promo.';

        // Deduplicate keep order
        return array_values(array_unique($steps));
    }

    /**
     * Basic fallback T&C.
     * @return array<int,string>
     */
    public function buildTncTemplate(Promotion $p): array
    {
        $tnc   = [];
        $tnc[] = 'Promo berlaku selama periode yang tercantum pada halaman promo.';
        if ($p->require_coupon) {
            $tnc[] = 'Promo memerlukan kupon sah dan aktif.';
        }
        if ($p->default_channel?->value === 'referral') {
            $tnc[] = 'Promo hanya berlaku melalui channel referral yang ditentukan.';
        }
        if ($p->default_channel?->value === 'manual') {
            $tnc[] = 'Promo diterapkan oleh admin/manager sesuai kebijakan.';
        }
        $tnc[] = 'Promo tidak dapat diuangkan dan dapat berubah sesuai kebijakan.';
        $tnc[] = 'Rentro berhak membatalkan promo jika terindikasi penyalahgunaan.';

        return array_values(array_unique($tnc));
    }
}
