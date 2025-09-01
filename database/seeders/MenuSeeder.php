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
                'id' => 'overview',
                'label' => 'Ringkasan',
                'items' => [
                    ['label' => 'Dashboard', 'href' => route('dashboard'), 'icon' => 'Home'],
                ],
            ],

            [
                'id' => 'sewa',
                'label' => 'Sewa',
                'items' => [
                    ['label' => 'Booking', 'href' => '#', 'icon' => 'CalendarCheck'],
                    ['label' => 'Kontrak', 'href' => route('management.contracts.index'), 'icon' => 'ScrollText'],
                ],
            ],

            [
                'id' => 'keuangan',
                'label' => 'Keuangan',
                'items' => [
                    [
                        'label' => 'Transaksi',
                        'icon'  => 'Wallet',
                        'children' => [
                            ['label' => 'Tagihan', 'href' => route('management.invoices.index'), 'icon' => 'ReceiptText'],
                            ['label' => 'Pembayaran', 'href' => route('management.payments.index'), 'icon' => 'CreditCard'],
                            ['label' => 'Rekonsiliasi', 'href' => '#', 'icon' => 'FileBarChart2'],
                            ['label' => 'Laporan', 'href' => '#', 'icon' => 'BarChart3'],
                        ],
                    ],
                ],
            ],

            [
                'id' => 'properti',
                'label' => 'Properti',
                'items' => [
                    [
                        'label' => 'Kamar',
                        'icon'  => 'Bed',
                        'children' => [
                            ['label' => 'Daftar Kamar', 'href' => route('management.rooms.index'), 'icon' => 'BedDouble', 'permission' => PermissionName::ROOM_MANAGE_VIEW],
                            ['label' => 'Tipe Kamar', 'href' => route('management.room-types.index'), 'icon' => 'Tags'],
                            ['label' => 'Fasilitas', 'href' => route('management.amenities.index'), 'icon' => 'AirVent'],
                        ],
                    ],
                    [
                        'label' => 'Struktur Gedung',
                        'icon'  => 'Building2',
                        'children' => [
                            ['label' => 'Gedung', 'href' => route('management.buildings.index'), 'icon' => 'Building2'],
                            ['label' => 'Lantai', 'href' => route('management.floors.index'), 'icon' => 'Layers'],
                        ],
                    ],
                ],
            ],

            [
                'id' => 'tenant',
                'label' => 'Tenant',
                'items' => [
                    ['label' => 'Booking Saya', 'href' => route('tenant.bookings.index'), 'icon' => 'CalendarCheck'],
                    ['label' => 'Kontrak Saya', 'href' => route('tenant.contracts.index'), 'icon' => 'ScrollText'],
                    ['label' => 'Tagihan Saya', 'href' => route('tenant.invoices.index'), 'icon' => 'ReceiptText'],
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
                            ['label' => 'SLA', 'href' => '#', 'icon' => 'Timer'],
                        ],
                    ],
                    [
                        'label' => 'Inventaris',
                        'icon' => 'Package',
                        'children' => [
                            ['label' => 'Barang', 'href' => '#', 'icon' => 'Package'],
                            ['label' => 'Mutasi', 'href' => '#', 'icon' => 'MoveHorizontal'],
                            ['label' => 'Riwayat', 'href' => '#', 'icon' => 'Archive'],
                            ['label' => 'Disposal', 'href' => '#', 'icon' => 'Archive'],
                        ],
                    ],
                    ['label' => 'Keluhan', 'href' => '#', 'icon' => 'MessageSquareWarning'],
                    ['label' => 'Paket', 'href' => '#', 'icon' => 'Package'],
                ],
            ],

            [
                'id' => 'admin',
                'label' => 'Administrasi',
                'items' => [
                    [
                        'label' => 'Akses',
                        'icon' => 'ShieldCheck',
                        'children' => [
                            ['label' => 'Pengguna', 'href' => route('management.users.index'), 'icon' => 'Users', 'permission' => PermissionName::USER_VIEW],
                            ['label' => 'Roles', 'href' => route('management.roles.index'), 'icon' => 'KeySquare', 'permission' => PermissionName::ROLE_VIEW],
                            ['label' => 'Audit Log', 'href' => route('management.audit-logs.index'), 'icon' => 'ShieldCheck', 'permission' => PermissionName::AUDIT_LOG_VIEW],
                        ],
                    ],
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
                            ['label' => 'Notifikasi', 'href' => '#', 'icon' => 'Bell'],
                            ['label' => 'Preferensi', 'href' => '#', 'icon' => 'Settings2'],
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
