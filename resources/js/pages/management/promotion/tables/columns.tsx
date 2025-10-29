/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { Can } from '@/components/acl';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import i18n from '@/lib/i18n';
import type { PromotionItem } from '@/types/management';

export function createColumns(opts: {
    onEdit: (it: PromotionItem) => void;
    onDelete: (it: PromotionItem) => void;
}): ColumnDef<unknown>[] {
    return [
        {
            accessorKey: 'name',
            enableSorting: true,
            header: ({ column }) => (
                <DataTableColumnHeader column={column as any} title="Name" />
            ),
            cell: ({ row }) => {
                const it = row.original as PromotionItem;
                return (
                    <a
                        href={route('management.promotions.show', it.id)}
                        className="text-primary hover:underline"
                    >
                        {it.name}
                    </a>
                );
            },
        },
        {
            accessorKey: 'slug',
            enableSorting: false,
            header: ({ column }) => (
                <DataTableColumnHeader column={column as any} title="Slug" />
            ),
        },
        {
            accessorKey: 'stack_mode',
            enableSorting: false,
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column as any}
                    title={i18n.t(
                        'management/promotions:promotion.label.stack_mode',
                    )}
                />
            ),
            cell: ({ row }) => {
                const raw = String(
                    (row.original as PromotionItem).stack_mode || '',
                ).trim();
                const key = raw.replace(/\s+/g, '_').toLowerCase();
                const label = i18n.t(
                    `management/promotions:promotion.stack.${key}`,
                    { defaultValue: raw || '-' },
                );
                return <span>{label}</span>;
            },
        },
        {
            accessorKey: 'default_channel',
            enableSorting: false,
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column as any}
                    title={i18n.t(
                        'management/promotions:promotion.label.channel',
                    )}
                />
            ),
            cell: ({ row }) => {
                const raw = String(
                    (row.original as PromotionItem).default_channel || '',
                ).trim();
                if (!raw)
                    return (
                        <span>
                            {i18n.t('management/promotions:common.any')}
                        </span>
                    );
                const key = raw.replace(/\s+/g, '_').toLowerCase();
                const label = i18n.t(`management/promotions:channel.${key}`, {
                    defaultValue: raw,
                });
                return <span className="capitalize">{label}</span>;
            },
        },
        {
            accessorKey: 'priority',
            enableSorting: true,
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column as any}
                    title="Priority"
                />
            ),
        },
        {
            accessorKey: 'is_active',
            enableSorting: false,
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column as any}
                    title={i18n.t('common.active', 'Active')}
                />
            ),
            cell: ({ row }) =>
                (row.original as PromotionItem).is_active
                    ? i18n.t('common.yes')
                    : i18n.t('common.no'),
        },
        {
            id: 'actions',
            enableHiding: false,
            header: ({ column }) => (
                <div className="text-right">
                    <DataTableColumnHeader
                        column={column as any}
                        title={i18n.t('common.actions')}
                    />
                </div>
            ),
            cell: ({ row }) => {
                const it = row.original as PromotionItem;
                return (
                    <div className="flex items-center justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={i18n.t('common.actions')}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>
                                    {i18n.t('common.actions')}
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() =>
                                        (window.location.href = route(
                                            'management.promotions.show',
                                            it.id,
                                        ))
                                    }
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    {i18n.t('common.view_detail')}
                                </DropdownMenuItem>
                                <Can all={[`promotion.update`]}>
                                    <DropdownMenuItem
                                        onClick={() => opts.onEdit(it)}
                                    >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        {i18n.t('common.edit')}
                                    </DropdownMenuItem>
                                </Can>
                                <DropdownMenuSeparator />
                                <Can all={[`promotion.delete`]}>
                                    <DropdownMenuItem
                                        onClick={() => opts.onDelete(it)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {i18n.t('common.delete')}
                                    </DropdownMenuItem>
                                </Can>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];
}
