<?php

namespace Database\Seeders;

use App\Enum\PromotionChannel;
use App\Enum\PromotionStackMode;
use App\Models\Promotion;
use App\Models\PromotionCoupon;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PromotionSeeder extends Seeder
{
    public function run(): void
    {
        $today = Carbon::now()->startOfDay();

        // 1) WELCOME20 — 20% off first 2 months (coupon required)
        $this->upsertPromotion(
            slug: 'welcome20',
            attrs: [
                'name'            => 'WELCOME20',
                'description'     => 'Diskon 20% untuk 2 bulan pertama (gunakan kode WELCOME20).',
                'stack_mode'      => PromotionStackMode::HIGHEST_ONLY->value,
                'priority'        => 10,
                'default_channel' => PromotionChannel::COUPON->value,
                'require_coupon'  => true,
                'is_active'       => true,
                'tags'            => ['welcome', 'first2months'],
                'valid_from'      => $today->toDateString(),
                'valid_until'     => $today->copy()->addDays(60)->toDateString(),
            ],
            rules: [
                [
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'billing_periods'    => ['monthly'],
                    'first_n_periods'    => 2,
                    'channel'            => PromotionChannel::COUPON->value,
                ],
            ],
            actions: [
                [
                    'action_type'        => 'first_n_periods_percent',
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'percent_bps'        => 2000, // 20%
                    'n_periods'          => 2,
                    'priority'           => 1,
                ],
            ],
            coupons: [
                ['code' => 'WELCOME20', 'is_active' => true, 'max_redemptions' => null, 'expires_at' => null],
            ],
        );

        // 2) EARLYBIRD100K — Rp100.000 off first month (public)
        $this->upsertPromotion(
            slug: 'earlybird100k',
            attrs: [
                'name'            => 'EARLYBIRD100K',
                'description'     => 'Potongan Rp100.000 untuk bulan pertama.',
                'stack_mode'      => PromotionStackMode::HIGHEST_ONLY->value,
                'priority'        => 20,
                'default_channel' => PromotionChannel::PUBLIC->value,
                'require_coupon'  => false,
                'is_active'       => true,
                'tags'            => ['firstmonth'],
                'valid_from'      => $today->toDateString(),
                'valid_until'     => $today->copy()->addDays(90)->toDateString(),
            ],
            rules: [
                [
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'billing_periods'    => ['monthly'],
                    'first_n_periods'    => 1,
                ],
            ],
            actions: [
                [
                    'action_type'        => 'first_n_periods_amount',
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'amount_idr'         => 100_000,
                    'n_periods'          => 1,
                    'priority'           => 1,
                ],
            ],
        );

        // 3) HEMAT-DP — 50% off deposit (public)
        $this->upsertPromotion(
            slug: 'hemat-dp',
            attrs: [
                'name'            => 'HEMAT-DP',
                'description'     => 'Diskon 50% untuk deposit.',
                'stack_mode'      => PromotionStackMode::HIGHEST_ONLY->value,
                'priority'        => 30,
                'default_channel' => PromotionChannel::PUBLIC->value,
                'require_coupon'  => false,
                'is_active'       => true,
                'tags'            => ['dp'],
                'valid_from'      => $today->toDateString(),
                'valid_until'     => $today->copy()->addDays(180)->toDateString(),
            ],
            rules: [
                [
                    'applies_to_rent'    => false,
                    'applies_to_deposit' => true,
                    'billing_periods'    => ['monthly', 'weekly', 'daily'],
                ],
            ],
            actions: [
                [
                    'action_type'        => 'percent',
                    'applies_to_rent'    => false,
                    'applies_to_deposit' => true,
                    'percent_bps'        => 5000, // 50%
                    'priority'           => 1,
                ],
            ],
        );

        // 4) FREE7D — Free 7 days (public)
        $this->upsertPromotion(
            slug: 'free7d',
            attrs: [
                'name'            => 'FREE7D',
                'description'     => 'Gratis 7 hari di awal (pro-rata).',
                'stack_mode'      => PromotionStackMode::STACK->value,
                'priority'        => 40,
                'default_channel' => PromotionChannel::PUBLIC->value,
                'require_coupon'  => false,
                'is_active'       => true,
                'tags'            => ['prorata'],
                'valid_from'      => $today->toDateString(),
                'valid_until'     => $today->copy()->addDays(45)->toDateString(),
            ],
            rules: [
                [
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'billing_periods'    => ['monthly'],
                ],
            ],
            actions: [
                [
                    'action_type'        => 'free_n_days',
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'n_days'             => 7,
                    'priority'           => 1,
                ],
            ],
        );
    }

    /**
     * Idempotent upsert for promotion header + relations.
     * Children are replaced to keep seeding consistent.
     * @param array<int, array> $rules
     * @param array<int, array> $actions
     * @param array<int, array> $coupons
     */
    protected function upsertPromotion(string $slug, array $attrs, array $rules = [], array $actions = [], array $coupons = []): void
    {
        $header = [
            'name'            => $attrs['name'] ?? $slug,
            'slug'            => $slug,
            'description'     => $attrs['description'] ?? null,
            'valid_from'      => $attrs['valid_from'] ?? null,
            'valid_until'     => $attrs['valid_until'] ?? null,
            'stack_mode'      => $attrs['stack_mode'] ?? PromotionStackMode::STACK->value,
            'priority'        => (int) ($attrs['priority'] ?? 100),
            'total_quota'     => $attrs['total_quota'] ?? null,
            'per_user_limit'  => $attrs['per_user_limit'] ?? null,
            'per_contract_limit' => $attrs['per_contract_limit'] ?? null,
            'per_invoice_limit'  => $attrs['per_invoice_limit'] ?? null,
            'per_day_limit'      => $attrs['per_day_limit'] ?? null,
            'per_month_limit'    => $attrs['per_month_limit'] ?? null,
            'default_channel' => $attrs['default_channel'] ?? null,
            'require_coupon'  => (bool) ($attrs['require_coupon'] ?? false),
            'is_active'       => (bool) ($attrs['is_active'] ?? true),
            'tags'            => $attrs['tags'] ?? null,
        ];

        /** @var Promotion $promo */
        $promo = Promotion::query()->updateOrCreate(['slug' => $slug], $header);

        // Replace children for idempotency
        $promo->rules()->delete();
        foreach ($rules as $r) {
            $promo->rules()->create([
                'min_spend_idr'      => $r['min_spend_idr'] ?? null,
                'max_discount_idr'   => $r['max_discount_idr'] ?? null,
                'applies_to_rent'    => (bool) ($r['applies_to_rent'] ?? true),
                'applies_to_deposit' => (bool) ($r['applies_to_deposit'] ?? false),
                'billing_periods'    => $r['billing_periods'] ?? null,
                'date_from'          => $r['date_from'] ?? null,
                'date_until'         => $r['date_until'] ?? null,
                'days_of_week'       => $r['days_of_week'] ?? null,
                'time_start'         => $r['time_start'] ?? null,
                'time_end'           => $r['time_end'] ?? null,
                'channel'            => $r['channel'] ?? null,
                'first_n_periods'    => $r['first_n_periods'] ?? null,
                'allowed_role_names' => $r['allowed_role_names'] ?? null,
                'allowed_user_ids'   => $r['allowed_user_ids'] ?? null,
            ]);
        }

        $promo->actions()->delete();
        foreach ($actions as $a) {
            $promo->actions()->create([
                'action_type'        => $a['action_type'],
                'applies_to_rent'    => (bool) ($a['applies_to_rent'] ?? true),
                'applies_to_deposit' => (bool) ($a['applies_to_deposit'] ?? false),
                'percent_bps'        => $a['percent_bps'] ?? null,
                'amount_idr'         => $a['amount_idr'] ?? null,
                'fixed_price_idr'    => $a['fixed_price_idr'] ?? null,
                'n_days'             => $a['n_days'] ?? null,
                'n_periods'          => $a['n_periods'] ?? null,
                'max_discount_idr'   => $a['max_discount_idr'] ?? null,
                'priority'           => (int) ($a['priority'] ?? 100),
            ]);
        }

        // Ensure coupons when provided
        foreach ($coupons as $c) {
            PromotionCoupon::query()->firstOrCreate([
                'promotion_id' => $promo->id,
                'code'         => (string) $c['code'],
            ], [
                'is_active'       => (bool) ($c['is_active'] ?? true),
                'max_redemptions' => $c['max_redemptions'] ?? null,
                'expires_at'      => $c['expires_at'] ?? null,
            ]);
        }
    }
}
