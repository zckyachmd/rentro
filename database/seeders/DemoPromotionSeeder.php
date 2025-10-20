<?php

namespace Database\Seeders;

use App\Enum\PromotionChannel;
use App\Enum\PromotionStackMode;
use App\Enum\RoleName;
use App\Models\Building;
use App\Models\Floor;
use App\Models\Promotion;
use App\Models\PromotionCoupon;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DemoPromotionSeeder extends Seeder
{
    public function run(): void
    {
        // Deterministic base dates for demo
        $today = Carbon::create(2025, 1, 1)->startOfDay();
        $tomorrow = $today->copy()->addDay();

        // Targets for scoped promotions (safe fallbacks)
        $building  = Building::query()->first();
        $floor     = Floor::query()->first();
        $roomType  = RoomType::query()->first();
        $room      = Room::query()->first();
        $adminUser = User::query()->orderBy('id')->first();

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
                'is_listed'       => true,
                'tags'            => ['welcome', 'first2months'],
                'valid_from'      => $today->toDateString(),
                'valid_until'     => $today->copy()->addDays(60)->toDateString(),
                'tnc'             => [
                    'Berlaku untuk 2 bulan pertama tagihan sewa (periode bulanan).',
                    'Hanya untuk penyewa baru yang belum pernah melakukan kontrak sebelumnya.',
                    'Kupon bersifat satu kali pakai per pengguna dan tidak dapat diuangkan.',
                    'Tidak berlaku jika dikombinasikan dengan promo eksklusif lain.',
                    'Rentro berhak membatalkan promo jika terindikasi penyalahgunaan.',
                ],
                'how'             => [
                    'Pilih kamar dan lanjutkan ke halaman checkout.',
                    'Pada kolom kupon, masukkan kode: WELCOME20 lalu terapkan.',
                    'Pastikan periode sewa adalah bulanan dan kuota promo masih tersedia.',
                    'Lanjutkan pembayaran sesuai metode yang tersedia untuk menyelesaikan transaksi.',
                ],
            ],
            scopes: [
                ['scope_type' => 'global'], // global promo
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
                'is_listed'       => true,
                'tags'            => ['firstmonth'],
                'valid_from'      => $today->toDateString(),
                'valid_until'     => $today->copy()->addDays(90)->toDateString(),
                'tnc'             => [
                    'Potongan Rp100.000 untuk bulan pertama periode bulanan.',
                    'Tidak memerlukan kupon dan berlaku untuk semua pengguna selama periode promo.',
                    'Tidak dapat diuangkan dan tidak berlaku untuk deposit.',
                ],
                'how'             => [
                    'Pilih kamar yang diinginkan dan lanjutkan ke checkout.',
                    'Promo akan terpasang otomatis pada bulan pertama jika memenuhi syarat.',
                    'Selesaikan pembayaran sesuai instruksi untuk mengaktifkan promo.',
                ],
            ],
            scopes: [
                ['scope_type' => 'global'],
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
                'is_listed'       => true,
                'tags'            => ['dp'],
                'valid_from'      => $today->toDateString(),
                'valid_until'     => $today->copy()->addDays(180)->toDateString(),
                'tnc'             => [
                    'Diskon 50% hanya berlaku pada komponen deposit.',
                    'Berlaku untuk periode harian, mingguan, dan bulanan.',
                    'Tidak dapat digabung dengan promo eksklusif yang mengatur harga deposit.',
                ],
                'how'             => [
                    'Pilih kamar dan lanjutkan ke checkout.',
                    'Promo akan otomatis diterapkan pada komponen deposit.',
                    'Selesaikan pembayaran untuk mengamankan kamar.',
                ],
            ],
            scopes: [
                ['scope_type' => 'global'],
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
                'is_listed'       => true,
                'tags'            => ['prorata'],
                'valid_from'      => $today->toDateString(),
                'valid_until'     => $today->copy()->addDays(45)->toDateString(),
                'tnc'             => [
                    'Gratis 7 hari pertama dihitung pro-rata dari harga bulanan.',
                    'Berlaku untuk sewa bulanan dan tidak dapat diuangkan.',
                ],
                'how'             => [
                    'Pilih periode sewa bulanan.',
                    'Lanjutkan checkout, maka diskon 7 hari akan terhitung otomatis.',
                ],
            ],
            scopes: [
                ['scope_type' => 'global'],
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

        // 5) TGIF-NIGHT — 25% off on Friday 18:00-23:59, weekly billing only, min spend 500k, cap 200k
        $this->upsertPromotion(
            slug: 'tgif-night',
            attrs: [
                'name'            => 'TGIF-NIGHT',
                'description'     => 'Diskon 25% setiap Jumat jam 18:00-23:59, min transaksi Rp500.000, maksimal diskon Rp200.000.',
                'stack_mode'      => PromotionStackMode::STACK->value,
                'priority'        => 50,
                'default_channel' => PromotionChannel::PUBLIC->value,
                'require_coupon'  => false,
                'is_active'       => true,
                'is_listed'       => true,
                'tags'            => ['time', 'weekly'],
                'valid_from'      => $today->toDateString(),
                'valid_until'     => $today->copy()->addMonths(3)->toDateString(),
                'tnc'             => [
                    'Hanya berlaku setiap hari Jumat pukul 18:00–23:59.',
                    'Minimal transaksi Rp500.000, maksimal diskon Rp200.000.',
                    'Hanya untuk tagihan mingguan.',
                ],
                'how'             => [
                    'Pilih periode mingguan pada kamar yang diinginkan.',
                    'Lakukan checkout pada rentang waktu 18:00–23:59 di hari Jumat.',
                    'Diskon 25% akan otomatis diterapkan bila syarat terpenuhi.',
                ],
            ],
            scopes: [
                ['scope_type' => 'global'],
            ],
            rules: [
                [
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'billing_periods'    => ['weekly'],
                    'min_spend_idr'      => 500_000,
                    'max_discount_idr'   => 200_000,
                    'days_of_week'       => [5], // Friday
                    'time_start'         => '18:00:00',
                    'time_end'           => '23:59:59',
                ],
            ],
            actions: [
                [
                    'action_type'        => 'percent',
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'percent_bps'        => 2500, // 25%
                    'max_discount_idr'   => 200_000,
                    'priority'           => 1,
                ],
            ],
        );

        // 6) PAYDAILY-FIX — Fixed price Rp250.000/day for specific Room Type (if available)
        if ($roomType) {
            $this->upsertPromotion(
                slug: 'paydaily-fix',
                attrs: [
                    'name'            => 'PAYDAILY-FIX',
                    'description'     => 'Harga tetap Rp250.000/hari untuk tipe kamar terpilih.',
                    'stack_mode'      => PromotionStackMode::EXCLUSIVE->value,
                    'priority'        => 15,
                    'default_channel' => null,
                    'require_coupon'  => false,
                    'is_active'       => true,
                    'is_listed'       => true,
                    'tags'            => ['fixed-price', 'daily'],
                    'valid_from'      => $today->toDateString(),
                    'valid_until'     => $today->copy()->addDays(45)->toDateString(),
                    'tnc'             => [
                        'Harga tetap Rp250.000/hari untuk tipe kamar yang ditentukan.',
                        'Promo bersifat eksklusif dan tidak dapat digabung.',
                    ],
                    'how'             => [
                        'Pilih kamar dengan tipe yang termasuk dalam promo.',
                        'Lanjutkan checkout; harga akan otomatis tampil Rp250.000/hari.',
                    ],
                ],
                scopes: [
                    [
                        'scope_type'   => 'room_type',
                        'room_type_id' => $roomType->id,
                    ],
                ],
                rules: [
                    [
                        'applies_to_rent'    => true,
                        'applies_to_deposit' => false,
                        'billing_periods'    => ['daily'],
                    ],
                ],
                actions: [
                    [
                        'action_type'        => 'fixed_price',
                        'applies_to_rent'    => true,
                        'applies_to_deposit' => false,
                        'fixed_price_idr'    => 250_000,
                        'priority'           => 1,
                    ],
                ],
            );
        }

        // 7) BUILDING10 — 10% off at specific building; cap 300k, monthly/weekly
        if ($building) {
            $this->upsertPromotion(
                slug: 'building10',
                attrs: [
                    'name'            => 'BUILDING10',
                    'description'     => 'Diskon 10% khusus gedung terpilih, maks Rp300.000.',
                    'stack_mode'      => PromotionStackMode::STACK->value,
                    'priority'        => 60,
                    'default_channel' => PromotionChannel::PUBLIC->value,
                    'require_coupon'  => false,
                    'is_active'       => true,
                    'is_listed'       => true,
                    'tags'            => ['building'],
                    'valid_from'      => $tomorrow->toDateString(),
                    'valid_until'     => $tomorrow->copy()->addMonths(2)->toDateString(),
                    'tnc'             => [
                        'Diskon 10% untuk kamar pada gedung yang ditentukan.',
                        'Maksimal diskon Rp300.000 per transaksi.',
                    ],
                    'how'             => [
                        'Pilih kamar pada gedung yang termasuk promo.',
                        'Lanjutkan checkout; diskon akan otomatis diterapkan.',
                    ],
                ],
                scopes: [
                    [
                        'scope_type'  => 'building',
                        'building_id' => $building->id,
                    ],
                ],
                rules: [
                    [
                        'applies_to_rent'    => true,
                        'applies_to_deposit' => false,
                        'billing_periods'    => ['monthly', 'weekly'],
                        'max_discount_idr'   => 300_000,
                    ],
                ],
                actions: [
                    [
                        'action_type'        => 'percent',
                        'applies_to_rent'    => true,
                        'applies_to_deposit' => false,
                        'percent_bps'        => 1000, // 10%
                        'max_discount_idr'   => 300_000,
                        'priority'           => 1,
                    ],
                ],
            );
        }

        // 8) FLOOR100K — Rp100.000 off only for specific floor, weekly only
        if ($floor) {
            $this->upsertPromotion(
                slug: 'floor100k',
                attrs: [
                    'name'            => 'FLOOR100K',
                    'description'     => 'Potongan Rp100.000 khusus lantai tertentu (weekly).',
                    'stack_mode'      => PromotionStackMode::HIGHEST_ONLY->value,
                    'priority'        => 70,
                    'default_channel' => PromotionChannel::PUBLIC->value,
                    'require_coupon'  => false,
                    'is_active'       => true,
                    'is_listed'       => true,
                    'tags'            => ['floor', 'weekly'],
                    'valid_from'      => $today->toDateString(),
                    'valid_until'     => $today->copy()->addMonths(6)->toDateString(),
                    'tnc'             => [
                        'Potongan Rp100.000 hanya berlaku untuk lantai yang ditentukan.',
                        'Hanya untuk periode mingguan dan tidak berlaku untuk deposit.',
                    ],
                    'how'             => [
                        'Pilih kamar di lantai yang termasuk promo.',
                        'Lanjutkan checkout; potongan Rp100.000 akan otomatis diterapkan.',
                    ],
                ],
                scopes: [
                    [
                        'scope_type' => 'floor',
                        'floor_id'   => $floor->id,
                    ],
                ],
                rules: [
                    [
                        'applies_to_rent'    => true,
                        'applies_to_deposit' => false,
                        'billing_periods'    => ['weekly'],
                    ],
                ],
                actions: [
                    [
                        'action_type'        => 'amount',
                        'applies_to_rent'    => true,
                        'applies_to_deposit' => false,
                        'amount_idr'         => 100_000,
                        'priority'           => 1,
                    ],
                ],
            );
        }

        // 9) ROOM-DAILY-FREE2 — Free 2 days for a specific room on daily period
        if ($room) {
            $this->upsertPromotion(
                slug: 'room-daily-free2',
                attrs: [
                    'name'            => 'ROOM-DAILY-FREE2',
                    'description'     => 'Gratis 2 hari untuk kamar tertentu (daily).',
                    'stack_mode'      => PromotionStackMode::STACK->value,
                    'priority'        => 80,
                    'default_channel' => null,
                    'require_coupon'  => false,
                    'is_active'       => true,
                    'is_listed'       => true,
                    'tags'            => ['room', 'daily'],
                    'valid_from'      => $today->toDateString(),
                    'valid_until'     => $today->copy()->addDays(30)->toDateString(),
                    'tnc'             => [
                        'Gratis 2 hari hanya untuk kamar tertentu pada periode harian.',
                        'Tidak dapat diuangkan dan tidak berlaku untuk deposit.',
                    ],
                    'how'             => [
                        'Pilih kamar terkait dan set periode harian.',
                        'Lanjutkan checkout; gratis 2 hari akan dihitung otomatis.',
                    ],
                ],
                scopes: [
                    [
                        'scope_type' => 'room',
                        'room_id'    => $room->id,
                    ],
                ],
                rules: [
                    [
                        'applies_to_rent'    => true,
                        'applies_to_deposit' => false,
                        'billing_periods'    => ['daily'],
                    ],
                ],
                actions: [
                    [
                        'action_type'        => 'free_n_days',
                        'applies_to_rent'    => true,
                        'applies_to_deposit' => false,
                        'n_days'             => 2,
                        'priority'           => 1,
                    ],
                ],
            );
        }

        // Extra upcoming promotions (for pagination demo)
        for ($i = 1; $i <= 4; $i++) {
            $start = $today->copy()->addDays(7 * $i);
            $end   = $start->copy()->addDays(30);
            $slug  = 'upcoming-' . $i;
            $this->upsertPromotion(
                slug: $slug,
                attrs: [
                    'name'            => strtoupper(str_replace('-', ' ', $slug)),
                    'description'     => 'Promo mendatang #' . $i,
                    'stack_mode'      => PromotionStackMode::STACK->value,
                    'priority'        => 5,
                    'default_channel' => PromotionChannel::PUBLIC->value,
                    'require_coupon'  => false,
                    'is_active'       => true,
                    'is_listed'       => true,
                    'tags'            => ['upcoming'],
                    'valid_from'      => $start->toDateString(),
                    'valid_until'     => $end->toDateString(),
                ],
                scopes: [['scope_type' => 'global']],
                rules: [[
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'billing_periods'    => ['monthly'],
                ]],
                actions: [[
                    'action_type'        => 'percent',
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'percent_bps'        => 500, // 5%
                    'priority'           => 1,
                ]],
            );
        }

        // Extra expired promotions (for pagination demo)
        for ($i = 1; $i <= 3; $i++) {
            $end   = $today->copy()->subDays(10 * $i);
            $start = $end->copy()->subDays(30);
            $slug  = 'expired-' . $i;
            $this->upsertPromotion(
                slug: $slug,
                attrs: [
                    'name'            => strtoupper(str_replace('-', ' ', $slug)),
                    'description'     => 'Promo berakhir #' . $i,
                    'stack_mode'      => PromotionStackMode::STACK->value,
                    'priority'        => 5,
                    'default_channel' => PromotionChannel::PUBLIC->value,
                    'require_coupon'  => false,
                    'is_active'       => true,
                    'is_listed'       => true,
                    'tags'            => ['expired'],
                    'valid_from'      => $start->toDateString(),
                    'valid_until'     => $end->toDateString(),
                ],
                scopes: [['scope_type' => 'global']],
                rules: [[
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'billing_periods'    => ['monthly'],
                ]],
                actions: [[
                    'action_type'        => 'amount',
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'amount_idr'         => 50_000,
                    'priority'           => 1,
                ]],
            );
        }

        // 10) REFER-5P — 5% referral channel only, per-user limit 1, total quota 200
        $this->upsertPromotion(
            slug: 'refer-5p',
            attrs: [
                'name'              => 'REFER-5P',
                'description'       => 'Diskon 5% khusus channel referral. Maks 1x per user, total kuota 200.',
                'stack_mode'        => PromotionStackMode::HIGHEST_ONLY->value,
                'priority'          => 90,
                'default_channel'   => PromotionChannel::REFERRAL->value,
                'require_coupon'    => false,
                'is_active'         => true,
                'is_listed'         => true,
                'tags'              => ['referral'],
                'valid_from'        => $today->toDateString(),
                'valid_until'       => $today->copy()->addMonths(12)->toDateString(),
                'total_quota'       => 200,
                'per_user_limit'    => 1,
                'per_invoice_limit' => 1,
                'tnc'               => [
                    'Diskon 5% khusus melalui channel referral.',
                    'Maksimal 1x per pengguna dan kuota terbatas.',
                ],
                'how'               => [
                    'Akses halaman melalui tautan referral yang valid.',
                    'Lanjutkan checkout; diskon 5% akan otomatis diterapkan.',
                ],
            ],
            scopes: [
                ['scope_type' => 'global'],
            ],
            rules: [
                [
                    'channel'            => PromotionChannel::REFERRAL->value,
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'billing_periods'    => ['monthly', 'weekly', 'daily'],
                ],
            ],
            actions: [
                [
                    'action_type'        => 'percent',
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'percent_bps'        => 500, // 5%
                    'priority'           => 1,
                ],
            ],
        );

        // 11) MANUAL-ADMIN-ONLY — 15% manual channel, only for Manager/Super Admin, per day/month caps
        $this->upsertPromotion(
            slug: 'manual-admin-15p',
            attrs: [
                'name'             => 'MANUAL-ADMIN-ONLY',
                'description'      => 'Diskon 15% hanya untuk channel MANUAL dan role Manager/Super Admin.',
                'stack_mode'       => PromotionStackMode::STACK->value,
                'priority'         => 25,
                'default_channel'  => PromotionChannel::MANUAL->value,
                'require_coupon'   => false,
                'is_active'        => true,
                'is_listed'        => true,
                'per_day_limit'    => 20,
                'per_month_limit'  => 200,
                'tags'             => ['manual', 'role'],
                'valid_from'       => $today->toDateString(),
                'valid_until'      => $today->copy()->addMonths(1)->toDateString(),
                'tnc'              => [
                    'Promo hanya dapat diterapkan oleh admin/manager (channel manual).',
                    'Berlaku limit harian dan bulanan sesuai kebijakan.',
                ],
                'how'              => [
                    'Hubungi admin/manager untuk meminta penerapan promo.',
                    'Admin akan menerapkan promo pada order Anda jika memenuhi syarat.',
                ],
            ],
            scopes: [
                ['scope_type' => 'global'],
            ],
            rules: [
                [
                    'channel'            => PromotionChannel::MANUAL->value,
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'allowed_role_names' => [RoleName::MANAGER->value, RoleName::SUPER_ADMIN->value],
                ],
            ],
            actions: [
                [
                    'action_type'        => 'percent',
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'percent_bps'        => 1500, // 15%
                    'priority'           => 1,
                ],
            ],
        );

        // 12) USER-SPECIFIC — Rp75.000 amount for a specific user (if found), coupon required with expiry and max redemptions
        if ($adminUser) {
            $this->upsertPromotion(
                slug: 'user75k',
                attrs: [
                    'name'             => 'USER75K',
                    'description'      => 'Potongan Rp75.000 khusus user tertentu, via kupon.',
                    'stack_mode'       => PromotionStackMode::HIGHEST_ONLY->value,
                    'priority'         => 35,
                    'default_channel'  => PromotionChannel::COUPON->value,
                    'require_coupon'   => true,
                    'is_active'        => true,
                    'is_listed'        => false,
                    'tags'             => ['user-specific'],
                    'valid_from'       => $today->toDateString(),
                    'valid_until'      => $today->copy()->addDays(14)->toDateString(),
                    'per_user_limit'   => 2,
                    'tnc'              => [
                        'Potongan Rp75.000 khusus pengguna tertentu (undangan).',
                        'Memerlukan kupon dan memiliki masa berlaku.',
                    ],
                    'how'              => [
                        'Masukkan kode kupon yang diberikan khusus untuk Anda.',
                        'Lanjutkan checkout hingga pembayaran untuk mengaktifkan promo.',
                    ],
                ],
                scopes: [
                    ['scope_type' => 'global'],
                ],
                rules: [
                    [
                        'applies_to_rent'    => true,
                        'applies_to_deposit' => false,
                        'allowed_user_ids'   => [$adminUser->id],
                    ],
                ],
                actions: [
                    [
                        'action_type'        => 'amount',
                        'applies_to_rent'    => true,
                        'applies_to_deposit' => false,
                        'amount_idr'         => 75_000,
                        'priority'           => 1,
                    ],
                ],
                coupons: [
                    [
                        'code'            => 'USR75K-' . strtoupper(substr((string) $adminUser->id, -4)),
                        'is_active'       => true,
                        'max_redemptions' => 2,
                        'expires_at'      => $today->copy()->addDays(14)->endOfDay(),
                    ],
                ],
        );

        // 13) PRIVATE-INFLUENCER — 10% referral-only, hidden from listing
        $this->upsertPromotion(
            slug: 'influencer-10',
            attrs: [
                'name'            => 'INFLUENCER-10',
                'description'     => 'Promo referral 10% khusus kolaborator, tidak tampil di halaman promo.',
                'stack_mode'      => PromotionStackMode::HIGHEST_ONLY->value,
                'priority'        => 95,
                'default_channel' => PromotionChannel::REFERRAL->value,
                'require_coupon'  => false,
                'is_active'       => true,
                'is_listed'       => false,
                'tags'            => ['referral', 'private'],
                'valid_from'      => $today->toDateString(),
                'valid_until'     => $today->copy()->addMonths(6)->toDateString(),
                'tnc'             => [
                    'Promo private, hanya aktif melalui tautan referral kolaborator.',
                    'Maksimal 1x per pengguna selama kuota tersedia.',
                ],
                'how'             => [
                    'Klik tautan referral yang dibagikan kolaborator.',
                    'Lanjutkan checkout; diskon 10% akan terpasang otomatis jika valid.',
                ],
            ],
            scopes: [
                ['scope_type' => 'global'],
            ],
            rules: [
                [
                    'channel'            => PromotionChannel::REFERRAL->value,
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'billing_periods'    => ['monthly', 'weekly', 'daily'],
                    'max_discount_idr'   => 400_000,
                ],
            ],
            actions: [
                [
                    'action_type'        => 'percent',
                    'applies_to_rent'    => true,
                    'applies_to_deposit' => false,
                    'percent_bps'        => 1000,
                    'priority'           => 1,
                ],
            ],
        );
    }
    }

    /**
     * Idempotent upsert for promotion header + relations.
     * Children are replaced to keep seeding consistent.
     * @param array<int, array> $scopes
     * @param array<int, array> $rules
     * @param array<int, array> $actions
     * @param array<int, array> $coupons
     */
    protected function upsertPromotion(string $slug, array $attrs, array $scopes = [], array $rules = [], array $actions = [], array $coupons = []): void
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
            'is_listed'       => (bool) ($attrs['is_listed'] ?? true),
            'tags'            => $attrs['tags'] ?? null,
            'tnc'             => $attrs['tnc'] ?? null,
            'how'             => $attrs['how'] ?? null,
        ];

        /** @var Promotion $promo */
        $promo = Promotion::query()->updateOrCreate(['slug' => $slug], $header);

        // Replace children for idempotency
        $promo->scopes()->delete();
        foreach ($scopes as $s) {
            $promo->scopes()->create([
                'scope_type'   => $s['scope_type'],
                'building_id'  => $s['building_id'] ?? null,
                'floor_id'     => $s['floor_id'] ?? null,
                'room_type_id' => $s['room_type_id'] ?? null,
                'room_id'      => $s['room_id'] ?? null,
            ]);
        }

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
