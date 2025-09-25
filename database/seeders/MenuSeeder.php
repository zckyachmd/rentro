<?php

namespace Database\Seeders;

use App\Enum\PermissionName;
use App\Enum\RoleName;
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
                'label' => 'menu.overview',
                'items' => [
                    ['label' => 'menu.dashboard', 'href' => route('dashboard'), 'icon' => 'Home'],
                    ['label' => 'menu.booking', 'href' => '#', 'icon' => 'CalendarCheck', 'roles' => [RoleName::TENANT->value]],
                    ['label' => 'menu.contracts', 'href' => route('tenant.contracts.index'), 'icon' => 'ScrollText', 'roles' => [RoleName::TENANT->value]],
                    ['label' => 'menu.invoices', 'href' => route('tenant.invoices.index'), 'icon' => 'ReceiptText', 'roles' => [RoleName::TENANT->value]],
                ],
            ],

            [
                'id' => 'sewa',
                'label' => 'menu.rent',
                'items' => [
                    ['label' => 'menu.booking', 'href' => '#', 'icon' => 'CalendarCheck'],
                    ['label' => 'menu.contracts', 'href' => route('management.contracts.index'), 'icon' => 'ScrollText', 'permission' => PermissionName::CONTRACT_VIEW],
                ],
            ],

            [
                'id' => 'keuangan',
                'label' => 'menu.finance',
                'items' => [
                    ['label' => 'menu.invoices', 'href' => route('management.invoices.index'), 'icon' => 'ReceiptText', 'permission' => PermissionName::INVOICE_VIEW],
                    ['label' => 'menu.payments', 'href' => route('management.payments.index'), 'icon' => 'CreditCard', 'permission' => PermissionName::PAYMENT_VIEW],
                    ['label' => 'menu.reconciliation', 'href' => '#', 'icon' => 'FileBarChart2'],
                    ['label' => 'menu.reports', 'href' => '#', 'icon' => 'BarChart3'],
                ],
            ],

            [
                'id' => 'properti',
                'label' => 'menu.property',
                'items' => [
                    [
                        'label' => 'menu.rooms',
                        'icon'  => 'Bed',
                        'children' => [
                            ['label' => 'menu.rooms.list', 'href' => route('management.rooms.index'), 'icon' => 'BedDouble', 'permission' => PermissionName::ROOM_MANAGE_VIEW],
                            ['label' => 'menu.room_types', 'href' => "" . route('management.room-types.index') . "", 'icon' => 'Tags', 'permission' => PermissionName::ROOM_TYPE_VIEW],
                            ['label' => 'menu.amenities', 'href' => "" . route('management.amenities.index') . "", 'icon' => 'AirVent', 'permission' => PermissionName::AMENITY_VIEW],
                        ],
                    ],
                    [
                        'label' => 'menu.structure',
                        'icon'  => 'Building2',
                        'children' => [
                            [
                                'label' => 'menu.buildings',
                                'href' => "" . route('management.buildings.index') . "",
                                'icon' => 'Building2',
                                'permission' => PermissionName::BUILDING_VIEW,
                            ],
                            [
                                'label' => 'menu.floors',
                                'href' => "" . route('management.floors.index') . "",
                                'icon' => 'Layers',
                                'permission' => PermissionName::FLOOR_VIEW,
                            ],
                        ],
                    ],
                ],
            ],

            [
                'id' => 'operasional',
                'label' => 'menu.operations',
                'items' => [
                    [
                        'label' => 'menu.tasks_maintenance',
                        'icon' => 'Wrench',
                        'children' => [
                            ['label' => 'menu.tasks', 'href' => '#', 'icon' => 'ClipboardCheck'],
                            ['label' => 'menu.maintenance', 'href' => '#', 'icon' => 'Wrench'],
                            ['label' => 'menu.task_templates', 'href' => '#', 'icon' => 'ClipboardCheck'],
                            ['label' => 'menu.sla', 'href' => '#', 'icon' => 'Timer'],
                        ],
                    ],
                    [
                        'label' => 'menu.inventory',
                        'icon' => 'Package',
                        'children' => [
                            ['label' => 'menu.items', 'href' => '#', 'icon' => 'Package'],
                            ['label' => 'menu.transfers', 'href' => '#', 'icon' => 'MoveHorizontal'],
                            ['label' => 'menu.history', 'href' => '#', 'icon' => 'Archive'],
                            ['label' => 'menu.disposal', 'href' => '#', 'icon' => 'Archive'],
                        ],
                    ],
                    ['label' => 'menu.complaints', 'href' => '#', 'icon' => 'MessageSquareWarning'],
                    ['label' => 'menu.packages', 'href' => '#', 'icon' => 'Package'],
                ],
            ],

            [
                'id' => 'admin',
                'label' => 'menu.admin',
                'items' => [
                    ['label' => 'menu.users', 'href' => route('management.users.index'), 'icon' => 'Users', 'permission' => PermissionName::USER_VIEW],
                    ['label' => 'menu.roles', 'href' => route('management.roles.index'), 'icon' => 'KeySquare', 'permission' => PermissionName::ROLE_VIEW],
                    ['label' => 'menu.audit_log', 'href' => route('management.audit-logs.index'), 'icon' => 'ShieldCheck', 'permission' => PermissionName::AUDIT_LOG_VIEW],
                ],
            ],

            [
                'id' => 'akun',
                'label' => 'menu.account',
                'items' => [
                    ['label' => 'menu.profile', 'href' => route('profile.index'), 'icon' => 'User'],
                    [
                        'label' => 'menu.settings',
                        'icon' => 'Settings',
                        'children' => [
                            ['label' => 'menu.security', 'href' => route('security.index'), 'icon' => 'KeyRound'],
                            ['label' => 'menu.notifications', 'href' => '#', 'icon' => 'Bell'],
                            ['label' => 'menu.preferences', 'href' => '#', 'icon' => 'Settings2'],
                        ],
                    ],
                ],
            ],

            [
                'id' => 'bantuan',
                'label' => 'menu.help',
                'items' => [
                    ['label' => 'menu.docs', 'href' => '#', 'icon' => 'BookText'],
                    ['label' => 'menu.faq', 'href' => '#', 'icon' => 'HelpCircle'],
                    ['label' => 'menu.support', 'href' => '#', 'icon' => 'LifeBuoy'],
                    ['label' => 'menu.changelog', 'href' => '#', 'icon' => 'BookText'],
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
        $hrefProvided = array_key_exists('href', $item);
        $href         = $hrefProvided ? ($item['href'] ?? null) : null;

        $isPlaceholder = $hrefProvided && $href === '#';
        if (app()->environment('production') && $isPlaceholder) {
            return;
        }

        $isActive = true;
        if ($isPlaceholder) {
            $isActive = false;
        }

        $match = [
            'menu_group_id' => $groupId,
            'parent_id'     => $parentId,
        ];
        if (!empty($href) && $href !== '#') {
            $match['href'] = $href;
        } else {
            $match['label'] = $item['label'];
        }

        $menu = Menu::updateOrCreate(
            $match,
            [
                'href' => $href,
                'icon' => $item['icon'] ?? 'Circle',
                'permission_name' => $item['permission'] ?? null,
                'allowed_roles'   => $item['roles'] ?? null,
                'excluded_roles'  => $item['exclude_roles'] ?? null,
                'sort_order' => $order,
                'is_active' => $isActive,
                'label' => $item['label'],
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
