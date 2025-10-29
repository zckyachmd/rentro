'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { Can } from '@/components/acl';
import { Button } from '@/components/ui/button';
import { makeColumn } from '@/components/ui/data-table-column-header';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import i18n from '@/lib/i18n';
import type { ManagementRoomTypeItem } from '@/types/management';

const COL = {
    name: 'shrink-0 w-[220px] md:w-[280px] lg:w-[320px]',
    capacity: 'shrink-0 w-[120px] md:w-[150px] text-center',
    price: 'shrink-0 w-[160px] md:w-[180px] text-right',
    active: 'shrink-0 w-[110px] md:w-[130px] text-center',
    actions: 'shrink-0 w-[96px] md:w-[110px] text-right ml-auto',
} as const;

export const createColumns = (opts?: {
    onEdit?: (a: ManagementRoomTypeItem) => void;
    onDelete?: (a: ManagementRoomTypeItem) => void;
}): ColumnDef<ManagementRoomTypeItem>[] => [
    makeColumn<ManagementRoomTypeItem>({
        id: 'name',
        accessorKey: 'name',
        title: i18n.t('common.name'),
        className: COL.name,
        sortable: true,
        cell: ({ getValue }) => (
            <div className={COL.name}>{String(getValue() ?? '')}</div>
        ),
    }),
    makeColumn<ManagementRoomTypeItem>({
        id: 'capacity',
        accessorKey: 'capacity',
        title: i18n.t('management/room-types:form.capacity'),
        className: COL.capacity,
        sortable: true,
        cell: ({ getValue }) => (
            <div className={COL.capacity}>{String(getValue() ?? '')}</div>
        ),
    }),
    makeColumn<ManagementRoomTypeItem>({
        id: 'price',
        accessorKey: 'price_monthly_rupiah',
        title: i18n.t('management/room-types:form.price_monthly'),
        className: COL.price,
        sortable: true,
        cell: ({ row }) => {
            const r = row.original;
            // Already pre-formatted from server; fallback client format if needed
            const txt =
                r.price_monthly_rupiah ??
                (r.price_monthly_rupiah == null ? '—' : r.price_monthly_rupiah);
            return <div className={COL.price}>{txt ?? '—'}</div>;
        },
    }),
    makeColumn<ManagementRoomTypeItem>({
        id: 'active',
        accessorKey: 'is_active',
        title: i18n.t('common.active', 'Active'),
        className: COL.active,
        cell: ({ getValue }) => (
            <div className={COL.active}>
                {(getValue() as boolean)
                    ? i18n.t('common.yes')
                    : i18n.t('common.no')}
            </div>
        ),
    }),
    makeColumn<ManagementRoomTypeItem>({
        id: 'actions',
        title: i18n.t('common.actions'),
        className: `${COL.actions} pr-2 md:pr-3 flex justify-end items-center`,
        cell: ({ row }) => {
            const a = row.original;
            return (
                <div
                    className={`${COL.actions} flex items-center justify-end pr-2 md:pr-3`}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
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
                            <Can all={['room-type.update']}>
                                <DropdownMenuItem
                                    onClick={() => opts?.onEdit?.(a)}
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {i18n.t('common.edit')}
                                </DropdownMenuItem>
                            </Can>
                            <DropdownMenuSeparator />
                            <Can all={['room-type.delete']}>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => opts?.onDelete?.(a)}
                                >
                                    <Trash2 className="text-destructive mr-2 h-4 w-4" />
                                    {i18n.t('common.delete')}
                                </DropdownMenuItem>
                            </Can>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    }),
];
