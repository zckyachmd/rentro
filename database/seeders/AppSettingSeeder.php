<?php

namespace Database\Seeders;

use App\Models\AppSetting;
use App\Enum\ProrataCharging;
use Illuminate\Database\Seeder;

class AppSettingSeeder extends Seeder
{
    public function run(): void
    {
        // Operational, non-credential configuration that can be changed from the app
        // Single gateway casting via AppSetting::config() uses the `type` stored here.
        $settings = [
            // Contract basics
            ['key' => 'contract.grace_days', 'value' => 7, 'type' => 'int', 'description' => 'Batas toleransi hari sebelum kontrak dianggap terlambat (overdue)'],
            ['key' => 'contract.stop_auto_renew_forfeit_days', 'value' => 7, 'type' => 'int', 'description' => 'Batas minimal hari sebelum akhir agar penghentian auto‑renew tidak menghanguskan deposit'],
            ['key' => 'contract.auto_renew_default', 'value' => false, 'type' => 'bool', 'description' => 'Default auto‑renew untuk kontrak baru'],
            ['key' => 'contract.invoice_due_hours', 'value' => 48, 'type' => 'int', 'description' => 'Jam jatuh tempo sejak invoice dibuat'],

            // Contract duration limits & behavior
            ['key' => 'contract.daily_max_days', 'value' => 5, 'type' => 'int', 'description' => 'Batas maksimal lama sewa harian'],
            ['key' => 'contract.weekly_max_weeks', 'value' => 3, 'type' => 'int', 'description' => 'Batas maksimal lama sewa mingguan'],
            ['key' => 'contract.monthly_allowed_terms', 'value' => [3, 6, 12], 'type' => 'array', 'description' => 'Pilihan durasi (bulan) untuk sewa bulanan'],

            // Billing behavior
            ['key' => 'billing.prorata', 'value' => true, 'type' => 'bool', 'description' => 'Aktifkan perhitungan prorata saat mulai tidak di tanggal anchor'],
            ['key' => 'billing.prorata_charging', 'value' => ProrataCharging::THRESHOLD->value, 'type' => 'string', 'description' => 'Strategi penagihan prorata: full|free|threshold'],
            ['key' => 'billing.prorata_free_threshold_days', 'value' => 7, 'type' => 'int', 'description' => 'Ambang hari bebas biaya pada mode threshold'],
            ['key' => 'billing.release_day_of_month', 'value' => 1, 'type' => 'int', 'description' => 'Tanggal acuan siklus tagihan bulanan (DOM)'],
            ['key' => 'billing.due_day_of_month', 'value' => 7, 'type' => 'int', 'description' => 'Tanggal jatuh tempo default untuk tagihan bulanan'],
            ['key' => 'billing.deposit_renewal_rollover', 'value' => true, 'type' => 'bool', 'description' => 'Deposit diperhitungkan/bergulir saat perpanjangan'],
            // Removed: harga invoice selalu mengikuti nilai kontrak

            // Scheduler / automation
            ['key' => 'contract.auto_renew_lead_days', 'value' => 7, 'type' => 'int', 'description' => 'Hari sebelum akhir kontrak untuk memproses auto‑renew'],
            ['key' => 'contract.prebook_lead_days', 'value' => 7, 'type' => 'int', 'description' => 'Jendela pre‑booking untuk kamar yang akan habis masa kontraknya'],
            ['key' => 'contract.global_sequence', 'value' => 0, 'type' => 'int', 'description' => 'Counter sequence global untuk penomoran kontrak (4 digit)'],


            // Handover (Check-in/Check-out)
            ['key' => 'handover.require_checkin_for_activate', 'value' => true, 'type' => 'bool', 'description' => 'Wajib check‑in untuk mengaktifkan kontrak'],
            ['key' => 'handover.require_checkout_for_complete', 'value' => false, 'type' => 'bool', 'description' => 'Wajib checkout untuk menyelesaikan kontrak'],
            ['key' => 'handover.min_photos_checkin', 'value' => 3, 'type' => 'int', 'description' => 'Minimal jumlah foto untuk check‑in'],
            ['key' => 'handover.min_photos_checkout', 'value' => 0, 'type' => 'int', 'description' => 'Minimal jumlah foto untuk checkout'],
            ['key' => 'handover.require_tenant_ack_for_activate', 'value' => false, 'type' => 'bool', 'description' => 'Wajib konfirmasi tenant untuk aktivasi kontrak'],
            ['key' => 'handover.require_tenant_ack_for_complete', 'value' => false, 'type' => 'bool', 'description' => 'Wajib konfirmasi tenant untuk penyelesaian kontrak'],

            // Payments
            [
                'key' => 'payments.manual_bank_accounts',
                'value' => [
                    [
                        'bank'    => 'BCA',
                        'holder'  => 'PT Rentro Sejahtera',
                        'account' => '8888888888',
                    ],
                    [
                        'bank'    => 'BRI',
                        'holder'  => 'PT Rentro Sejahtera',
                        'account' => '123456789012345',
                    ],
                ],
                'type' => 'array',
                'description' => 'Daftar rekening tujuan untuk transfer manual (bank, nama pemegang, nomor rekening).',
            ],

            // Profile
            ['key' => 'profile.emergency_contacts_max', 'value' => 3, 'type' => 'int', 'description' => 'Batas maksimal jumlah kontak darurat per pengguna'],
        ];

        foreach ($settings as $row) {
            AppSetting::updateOrCreate(
                ['key' => $row['key']],
                [
                    'value' => $row['value'],
                    'type' => $row['type'],
                    'description' => $row['description'] ?? null,
                ],
            );
        }
    }
}
