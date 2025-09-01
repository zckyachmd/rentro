<?php

namespace Database\Seeders;

use App\Models\AppSetting;
use Illuminate\Database\Seeder;

class AppSettingSeeder extends Seeder
{
    public function run(): void
    {
        // Operational, non-credential configuration that can be changed from the app
        // Single gateway casting via AppSetting::config() uses the `type` stored here.
        $settings = [
            // Contract basics
            ['contract.grace_days',             7,          'int'],
            ['contract.auto_renew_default',     false,      'bool'],
            ['contract.invoice_due_hours',      48,         'int'],
            ['contract.single_room_per_tenant', true,       'bool'],

            // Contract duration limits & behavior
            ['contract.daily_max_days',         5,          'int'],
            ['contract.weekly_max_weeks',       3,          'int'],
            ['contract.monthly_allowed_terms',  [3, 6, 12], 'array'],

            // Billing behavior
            ['billing.prorata',                 false,      'bool'],
            ['billing.release_day_of_month',    1,          'int'],   // anchor day for monthly cycle start
            ['billing.due_day_of_month',        7,          'int'],   // default due day
            ['billing.deposit_upfront',         true,       'bool'],

            // Scheduler / automation
            ['contract.auto_renew_lead_days',   7,          'int'],
        ];

        foreach ($settings as [$key, $value, $type]) {
            AppSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'type' => $type]
            );
        }
    }
}
