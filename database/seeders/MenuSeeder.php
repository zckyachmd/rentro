<?php

namespace Database\Seeders;

use App\Enum\PermissionName;
use App\Models\Menu;
use App\Models\MenuGroup;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $structure = [
            [
                'id' => 'general',
                'label' => 'Umum',
                'items' => [
                    ['label' => 'Dashboard', 'href' => route('dashboard'), 'icon' => 'Home'],
                    ['label' => 'Kamar', 'href' => '#', 'icon' => 'Bed'],
                    ['label' => 'Penyewa', 'href' => '#', 'icon' => 'User'],
                    ['label' => 'Booking', 'href' => '#', 'icon' => 'CalendarCheck'],
                ],
            ],
            [
                'id' => 'keuangan',
                'label' => 'Keuangan',
                'items' => [
                    [
                        'label' => 'Keuangan',
                        'icon' => 'Wallet',
                        'children' => [
                            ['label' => 'Tagihan', 'href' => '#', 'icon' => 'ReceiptText'],
                            ['label' => 'Pembayaran', 'href' => '#', 'icon' => 'CreditCard'],
                            ['label' => 'Laporan', 'href' => '#', 'icon' => 'FileBarChart2'],
                            ['label' => 'Rekonsiliasi', 'href' => '#', 'icon' => 'FileBarChart2'],
                            ['label' => 'Aset', 'href' => '#', 'icon' => 'Package'],
                        ],
                    ],
                ],
            ],
            [
                'id' => 'operasional',
                'label' => 'Operasional',
                'items' => [
                    [
                        'label' => 'Tugas & Maintenance',
                        'icon' => 'Wrench',
                        'children' => [
                            ['label' => 'Tugas', 'href' => '#', 'icon' => 'ClipboardCheck'],
                            ['label' => 'Maintenance', 'href' => '#', 'icon' => 'Wrench'],
                            ['label' => 'Task Template', 'href' => '#', 'icon' => 'ClipboardCheck'],
                            ['label' => 'SLA', 'href' => '#', 'icon' => 'Wrench'],
                        ],
                    ],
                    [
                        'label' => 'Inventaris',
                        'icon' => 'Package',
                        'children' => [
                            ['label' => 'Barang', 'href' => '#', 'icon' => 'Package'],
                            ['label' => 'Riwayat', 'href' => '#', 'icon' => 'Archive'],
                            ['label' => 'Mutasi', 'href' => '#', 'icon' => 'Package'],
                            ['label' => 'Disposal', 'href' => '#', 'icon' => 'Archive'],
                        ],
                    ],
                    ['label' => 'Keluhan', 'href' => '#', 'icon' => 'MessageSquareWarning'],
                    ['label' => 'Paket', 'href' => '#', 'icon' => 'Package'],
                ],
            ],
            [
                'id' => 'akun',
                'label' => 'Akun',
                'items' => [
                    ['label' => 'Profil', 'href' => route('profile.show'), 'icon' => 'User'],
                    [
                        'label' => 'Pengaturan',
                        'icon' => 'Settings',
                        'children' => [
                            ['label' => 'Keamanan', 'href' => route('security.index'), 'icon' => 'KeyRound'],
                            ['label' => 'Preferensi', 'href' => '#', 'icon' => 'Settings'],
                        ],
                    ],
                ],
            ],
            [
                'id' => 'admin',
                'label' => 'Administrasi',
                'items' => [
                    [
                        'label' => 'Akses & Peran',
                        'icon' => 'ShieldCheck',
                        'children' => [
                            ['label' => 'Pengguna', 'href' => route('management.users.index'), 'icon' => 'Users', 'permission' => PermissionName::USER_VIEW],
                            ['label' => 'Roles', 'href' => route('management.roles.index'), 'icon' => 'KeySquare'],
                            ['label' => 'Audit Log', 'href' => '#', 'icon' => 'ShieldCheck'],
                        ],
                    ],
                ],
            ],
            [
                'id' => 'bantuan',
                'label' => 'Bantuan',
                'items' => [
                    ['label' => 'Dokumentasi', 'href' => '#', 'icon' => 'BookText'],
                    ['label' => 'FAQ', 'href' => '#', 'icon' => 'HelpCircle'],
                    ['label' => 'Support', 'href' => '#', 'icon' => 'LifeBuoy'],
                    ['label' => 'Changelog', 'href' => '#', 'icon' => 'BookText'],
                ],
            ],
        ];

        DB::transaction(function () use ($structure): void {
            foreach ($structure as $gIdx => $group) {
                $menuGroup = MenuGroup::updateOrCreate(
                    ['key' => $group['id']],
                    [
                        'label' => $group['label'],
                        'icon' => $group['icon'] ?? null,
                        'sort_order' => $gIdx + 1,
                        'is_active' => true,
                    ]
                );

                foreach ($group['items'] as $iIdx => $item) {
                    $this->upsertMenuItem(
                        groupId: $menuGroup->id,
                        item: $item,
                        order: $iIdx + 1,
                        parentId: null
                    );
                }
            }
        });
    }

    /**
     * Upsert item menu.
     *
     * @param  array{label:string,href?:?string,icon?:?string,children?:array<int, array>}  $item
     */
    protected function upsertMenuItem(int $groupId, array $item, int $order, ?int $parentId): void
    {
        $menu = Menu::updateOrCreate(
            [
                'menu_group_id' => $groupId,
                'label' => $item['label'],
                'parent_id' => $parentId,
            ],
            [
                'href' => $item['href'] ?? '#',
                'icon' => $item['icon'] ?? 'Circle',
                'permission_name' => $item['permission'] ?? null,
                'sort_order' => $order,
                'is_active' => true,
            ]
        );

        if (!empty($item['children']) && is_array($item['children'])) {
            foreach (array_values($item['children']) as $cIdx => $child) {
                $this->upsertMenuItem(
                    groupId: $groupId,
                    item: $child,
                    order: $cIdx + 1,
                    parentId: $menu->id
                );
            }
        }
    }
}
