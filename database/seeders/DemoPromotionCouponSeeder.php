<?php

namespace Database\Seeders;

use App\Models\Promotion;
use App\Models\PromotionCoupon;
use Illuminate\Database\Seeder;

class DemoPromotionCouponSeeder extends Seeder
{
    /**
     * Deterministic coupon codes for demo.
     * - For promos requiring coupons: ensure 1 code per promo: <SLUGUP>DEMO-01
     * - If no coupon-required promos exist, seed 1 code for all active promos (kept idempotent).
     */
    public function run(): void
    {
        $promotions = Promotion::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->get();
        if ($promotions->isEmpty()) {
            return;
        }

        $hasRequire = $promotions->where('require_coupon', true)->isNotEmpty();
        $target     = $hasRequire
            ? $promotions->where('require_coupon', true)->values()
            : $promotions->values();

        foreach ($target as $p) {
            $base  = strtoupper(str_replace(['-', '_'], '', (string) ($p->slug ?: 'PROMO')));
            $base  = substr($base, 0, 12);
            $code1 = $base . 'DEMO-01';

            PromotionCoupon::query()->firstOrCreate(
                [
                    'promotion_id' => (int) $p->id,
                    'code'         => $code1,
                ],
                [
                    'is_active'       => true,
                    'max_redemptions' => null,
                    'expires_at'      => null,
                ]
            );
        }
    }
}
