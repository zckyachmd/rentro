<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WifiGateway;
use App\Models\WifiPolicy;
use App\Models\WifiWhitelist;
use App\Enum\RoleName;

class WifiSetupSeeder extends Seeder
{
    public function run(): void
    {
        // =========
        // Gateways
        // =========
        $gateways = [
            [
                'gw_id'       => 'GW-KOSTAN-01',
                'mac_address' => '9C:CE:88:20:14:A6',
                'name'        => 'Gateway Kos Lantai 1',
                'mgmt_ip'     => null,
                'meta'        => [
                    'model'    => 'Ruijie RG-EG105G-V3',
                    'location' => 'Lantai 1',
                ],
            ],
        ];

        foreach ($gateways as $g) {
            WifiGateway::updateOrCreate(
                ['gw_id' => $g['gw_id']],
                [
                    'mac_address' => $g['mac_address'],
                    'name'        => $g['name'] ?? null,
                    'mgmt_ip'     => $g['mgmt_ip'] ?? null,
                    'meta'        => $g['meta'] ?? null,
                ]
            );
        }

        // =========
        // Policies (role-based)
        // =========
        $policies = [
            [
                'name'          => 'Tenant',
                'max_devices'   => 2,
                'quota_bytes'   => 30 * 1024 * 1024 * 1024,
                'quota' => [
                    'hard_cap' => true,
                    'windows' => [
                        'daily' =>   ['bytes' => 1 * 1024 * 1024 * 1024, 'reset_every_days' => 1],
                        'weekly' =>  ['bytes' => 5 * 1024 * 1024 * 1024, 'reset_every_weeks' => 1],
                        'monthly' => ['bytes' => null,                   'reset_every_months' => 1],
                    ],
                ],
                'max_uptime_s'  => null,
                'is_active'     => true,
                'schedule_json' => null,
                'meta'          => [
                    'roles' => [RoleName::TENANT->value],
                    'notes' => 'Policy default untuk penyewa/tenant',
                ],
            ],
            [
                'name'          => 'Management',
                'max_devices'   => 5,
                'quota_bytes'   => null,
                'quota' => [
                    'hard_cap' => true,
                    'windows' => [
                        'daily' =>   ['bytes' => null, 'reset_every_days' => null],
                        'weekly' =>  ['bytes' => null, 'reset_every_weeks' => null],
                        'monthly' => ['bytes' => null, 'reset_every_months' => null],
                    ],
                ],
                'max_uptime_s'  => null,
                'is_active'     => true,
                'schedule_json' => null,
                'meta'          => [
                    'roles' => [
                        RoleName::MANAGER->value,
                        RoleName::OWNER->value,
                        RoleName::SUPER_ADMIN->value,
                    ],
                    'notes' => 'Policy untuk manajemen/owner/super-admin',
                ],
            ],
        ];

        foreach ($policies as $p) {
            WifiPolicy::updateOrCreate(
                ['name' => $p['name']],
                [
                    'max_devices'   => $p['max_devices'],
                    'quota_bytes'   => $p['quota_bytes'],
                    'quota'         => $p['quota'] ?? null,
                    'max_uptime_s'  => $p['max_uptime_s'],
                    'is_active'     => $p['is_active'],
                    'schedule_json' => $p['schedule_json'],
                    'meta'          => $p['meta'],
                ]
            );
        }

        // =========
        // Whitelist pra-login
        // =========
        $domainWhitelist = [
            ['type' => 'domain', 'value' => 'fonts.googleapis.com',      'notes' => 'Google Fonts CSS'],
            ['type' => 'domain', 'value' => 'fonts.gstatic.com',         'notes' => 'Google Fonts files'],
            ['type' => 'domain', 'value' => 'cdn.jsdelivr.net',          'notes' => 'Tailwind/JSDelivr CDN'],
            ['type' => 'domain', 'value' => 'cdn.tailwindcss.com',       'notes' => 'Tailwind CDN'],
            ['type' => 'domain', 'value' => 'www.googletagmanager.com',  'notes' => 'Google Tag Manager'],
            ['type' => 'domain', 'value' => 'www.google-analytics.com',  'notes' => 'Google Analytics'],
        ];

        $ipWhitelist = [
            ['type' => 'ip', 'value' => '1.1.1.1', 'notes' => 'Cloudflare DNS'],
            ['type' => 'ip', 'value' => '8.8.8.8', 'notes' => 'Google Public DNS'],
        ];

        foreach (array_merge($domainWhitelist, $ipWhitelist) as $w) {
            WifiWhitelist::updateOrCreate(
                ['type' => $w['type'], 'value' => $w['value']],
                ['notes' => $w['notes']]
            );
        }

        // Contoh jika perlu whitelist MAC perangkat internal (printer/CCTV):
        // WifiWhitelist::updateOrCreate(
        //     ['type' => 'mac', 'value' => 'AA:BB:CC:DD:EE:FF'],
        //     ['notes' => 'Printer Lantai 1']
        // );
    }
}
