<?php

namespace Database\Seeders;

use App\Models\AppSetting;
use Illuminate\Database\Seeder;

class AppSettingSeeder extends Seeder
{
    public function run(): void
    {
        // Konfigurasi operasional non-kredensial yang bisa diubah dari aplikasi
        AppSetting::updateOrCreate(
            ['key' => 'contract.grace_days'],
            ['value' => 7]
        );

        AppSetting::updateOrCreate(
            ['key' => 'contract.auto_renew_default'],
            ['value' => true]
        );
    }
}

