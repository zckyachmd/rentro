<?php

namespace Database\Seeders;

use App\Models\Promotion;
use App\Models\PromotionCoupon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PromotionCouponSeeder extends Seeder
{
    /**
     * Seed coupons for existing promotions.
     * - Targets promos with require_coupon = true by default.
     * - Controlled by env PROMO_COUPON_COUNT (default 50).
     * - Uses prefix from promotion slug/name.
     */
    public function run(): void
    {
        $defaultCount = (int) env('PROMO_COUPON_COUNT', 50);

        // Target promotions: require_coupon true first; if none, fallback to all active promos
        $promotions = Promotion::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->get();

        if ($promotions->isEmpty()) {
            $this->command?->warn('No promotions found; skipping coupon seeding.');
            return;
        }

        foreach ($promotions as $promo) {
            $targetOnlyCouponRequired = $promotions->where('require_coupon', true)->isNotEmpty();
            if ($targetOnlyCouponRequired && !$promo->require_coupon) {
                continue;
            }

            $existing = (int) PromotionCoupon::query()->where('promotion_id', $promo->id)->count();
            $need = max(0, $defaultCount - $existing);
            if ($need <= 0) {
                $this->command?->line("[{$promo->slug}] has {$existing} coupons; skipping.");
                continue;
            }

            $prefix = $this->makePrefix($promo);
            $length = 10; // random part length

            $generated = 0;
            $tries = 0;
            while ($generated < $need && $tries < ($need * 20)) {
                $tries++;
                $code = $this->randomCode($prefix, $length);
                $exists = PromotionCoupon::query()
                    ->where('promotion_id', $promo->id)
                    ->where('code', $code)
                    ->exists();
                if ($exists) {
                    continue;
                }

                PromotionCoupon::create([
                    'promotion_id'    => $promo->id,
                    'code'            => $code,
                    'is_active'       => true,
                    'max_redemptions' => null,
                    'expires_at'      => null,
                ]);
                $generated++;
            }

            $this->command?->info("Seeded {$generated} coupon(s) for promo: {$promo->slug}");
        }
    }

    protected function makePrefix(Promotion $p): string
    {
        $base = $p->slug ?: Str::slug((string) $p->name);
        $base = strtoupper(str_replace(['-', '_'], '', (string) $base));
        if ($base === '') {
            $base = 'PROMO';
        }
        return substr($base, 0, 4);
    }

    protected function randomCode(string $prefix, int $len): string
    {
        $rand = strtoupper(bin2hex(random_bytes((int) ceil($len / 2))));
        return $prefix . substr($rand, 0, $len);
    }
}

