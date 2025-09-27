<?php

namespace Database\Seeders;

use App\Models\PublicMenu;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Seeder;

class PublicMenuSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            PublicMenu::query()->delete();

            // Header menus
            $menus = [
                ['placement' => 'header', 'label' => 'Beranda', 'href' => '/',        'icon' => 'Home',      'sort' => 1],
                [
                    'placement' => 'header',
                    'label' => 'Kamar',
                    'href' => '/catalog',
                    'icon' => 'Building2',
                    'sort' => 2,
                    'children' => [
                        ['placement' => 'header', 'label' => 'Semua Kamar', 'href' => '/catalog',                 'icon' => 'LayoutGrid',    'sort' => 1],
                        ['placement' => 'header', 'label' => 'Tersedia',    'href' => '/catalog?available=1',     'icon' => 'CheckCircle',   'sort' => 2],
                        [
                            'placement' => 'header',
                            'label' => 'Berdasarkan Tipe',
                            'icon' => 'Layers',
                            'sort' => 3,
                            'children' => [
                                ['placement' => 'header', 'label' => 'Standar', 'href' => '/catalog?type=standard', 'icon' => 'BedSingle', 'sort' => 1],
                                ['placement' => 'header', 'label' => 'Deluxe',  'href' => '/catalog?type=deluxe',   'icon' => 'Crown',     'sort' => 2],
                                ['placement' => 'header', 'label' => 'Suite',   'href' => '/catalog?type=suite',    'icon' => 'Gem',       'sort' => 3],
                            ],
                        ],
                        [
                            'placement' => 'header',
                            'label' => 'Filter Lanjutan',
                            'icon' => 'SlidersHorizontal',
                            'sort' => 4,
                            'children' => [
                                ['placement' => 'header', 'label' => 'Harga < 1jt',       'href' => '/catalog?priceMax=1000000', 'icon' => 'Tag',        'sort' => 1],
                                ['placement' => 'header', 'label' => 'Dengan AC',         'href' => '/catalog?amenity=ac',       'icon' => 'Snowflake',  'sort' => 2],
                                ['placement' => 'header', 'label' => 'Kamar Mandi Dalam', 'href' => '/catalog?amenity=ensuite',  'icon' => 'ShowerHead', 'sort' => 3],
                            ],
                        ],
                    ],
                ],
                [
                    'placement' => 'header',
                    'label' => 'Promo',
                    'href' => '/promos',
                    'icon' => 'Percent',
                    'sort' => 3,
                ],
                ['placement' => 'header', 'label' => 'Blog',  'href' => '/blog',  'icon' => 'Newspaper', 'sort' => 4],
            ];

            // Footer menus (max 2 grouped sections)
            $footer = [
                [
                    'placement' => 'footer',
                    'label' => 'Solusi',
                    'sort' => 1,
                    'children' => [
                        ['placement' => 'footer', 'label' => 'Katalog Kamar',   'href' => '/catalog',                 'sort' => 1],
                        ['placement' => 'footer', 'label' => 'Promo',            'href' => '/promos',                  'sort' => 2],
                        ['placement' => 'footer', 'label' => 'Blog',             'href' => '/blog',                    'sort' => 3],
                    ],
                ],
                [
                    'placement' => 'footer',
                    'label' => 'Bantuan & Legal',
                    'sort' => 2,
                    'children' => [
                        ['placement' => 'footer', 'label' => 'Pusat Bantuan',        'href' => '/help',         'sort' => 1],
                        ['placement' => 'footer', 'label' => 'Kebijakan Privasi',    'href' => '/privacy',      'sort' => 2],
                        ['placement' => 'footer', 'label' => 'Syarat & Ketentuan',   'href' => '/terms',        'sort' => 3],
                        ['placement' => 'footer', 'label' => 'FAQ',                  'href' => '/help#faq',     'sort' => 4],
                    ],
                ],
            ];

            $insert = function (array $nodes, ?int $parentId = null) use (&$insert) {
                $hasI18n = Schema::hasColumn('public_menus', 'label_i18n');

                foreach ($nodes as $node) {
                    $children = $node['children'] ?? [];
                    unset($node['children']);

                    $payload = [
                        'placement' => $node['placement'] ?? 'header',
                        'label'     => $node['label'] ?? '',
                        'href'      => $node['href']  ?? null,
                        'icon'      => $node['icon']  ?? null,
                        'target'    => $node['target'] ?? null,
                        'rel'       => $node['rel'] ?? null,
                        'sort'      => $node['sort'] ?? 0,
                        'is_active' => $node['is_active'] ?? true,
                        'parent_id' => $parentId,
                    ];

                    if ($hasI18n) {
                        $payload['label_i18n'] = $this->labelI18n($payload['label']);
                    }

                    $created = PublicMenu::create($payload);

                    if (!empty($children)) {
                        $insert($children, $created->id);
                    }
                }
            };

            $insert($menus);
            $insert($footer);
        });
    }

    private function labelI18n(string $idLabel): array
    {
        $map = [
            // Header groups
            'Beranda' => 'Home',
            'Kamar' => 'Rooms',
            'Semua Kamar' => 'All Rooms',
            'Tersedia' => 'Available',
            'Berdasarkan Tipe' => 'By Type',
            'Standar' => 'Standard',
            'Deluxe' => 'Deluxe',
            'Suite' => 'Suite',
            'Filter Lanjutan' => 'Advanced Filters',
            'Harga < 1jt' => 'Price < 1m',
            'Dengan AC' => 'With AC',
            'Kamar Mandi Dalam' => 'Ensuite Bathroom',
            'Promo' => 'Promos',
            'Promo Aktif' => 'Active Promos',
            'Hemat DP' => 'Low Down Payment',
            'Blog' => 'Blog',
            // Footer groups
            'Solusi' => 'Solutions',
            'Perusahaan' => 'Company',
            'Bantuan & Legal' => 'Help & Legal',
            'Katalog Kamar' => 'Room Catalog',
            'Tentang' => 'About',
            'Karir' => 'Careers',
            'Kontak' => 'Contact',
            'Pusat Bantuan' => 'Help Center',
            'Kebijakan Privasi' => 'Privacy Policy',
            'Syarat & Ketentuan' => 'Terms & Conditions',
            'FAQ' => 'FAQ',
        ];

        return ['id' => $idLabel, 'en' => $map[$idLabel] ?? $idLabel];
    }
}
