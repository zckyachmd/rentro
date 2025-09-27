'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';

import { Can } from '@/components/acl';
import { Button } from '@/components/ui/button';
import { makeColumn } from '@/components/ui/data-table-column-header';
import i18n from '@/lib/i18n';
import type { BuildingItem } from '@/types/management';

const COL = {
    code: 'shrink-0 w-[120px]',
    name: 'shrink-0 w-[240px] md:w-[320px] lg:w-[380px]',
    address: 'w-full',
    active: 'shrink-0 w-[90px] text-center',
    actions: 'shrink-0 w-[96px] md:w-[110px] text-right ml-auto',
} as const;

export const createColumns = (opts?: {
    onEdit?: (b: BuildingItem) => void;
    onDelete?: (b: BuildingItem) => void;
}): ColumnDef<BuildingItem>[] => [
    makeColumn<BuildingItem>({
        id: 'code',
        accessorKey: 'code',
        title: i18n.t('common.code', 'Code'),
        className: COL.code,
        sortable: true,
        cell: ({ getValue }) => (
            <div className={COL.code}>{String(getValue() ?? '—')}</div>
        ),
    }),
    makeColumn<BuildingItem>({
        id: 'name',
        accessorKey: 'name',
        title: i18n.t('common.name'),
        className: COL.name,
        sortable: true,
        cell: ({ getValue }) => (
            <div className={COL.name}>{String(getValue() ?? '')}</div>
        ),
    }),
    makeColumn<BuildingItem>({
        id: 'address',
        accessorKey: 'address',
        title: i18n.t('common.address', 'Address'),
        className: COL.address,
        cell: ({ getValue }) => (
            <div className={COL.address}>{String(getValue() ?? '—')}</div>
        ),
    }),
    makeColumn<BuildingItem>({
        id: 'is_active',
        accessorKey: 'is_active',
        title: i18n.t('common.active', 'Active'),
        className: COL.active,
        sortable: true,
        cell: ({ getValue }) => (
            <div className={COL.active}>{getValue() ? 'Yes' : 'No'}</div>
        ),
    }),
    makeColumn<BuildingItem>({
        id: 'actions',
        title: i18n.t('common.actions'),
        className: COL.actions + ' flex justify-end items-center',
        cell: ({ row }) => {
            const b = row.original;
            return (
                <div className={COL.actions + ' flex justify-end gap-2'}>
                    <Can all={['building.update']}>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => opts?.onEdit?.(b)}
                            aria-label={i18n.t('common.edit')}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </Can>
                    <Can all={['building.delete']}>
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => opts?.onDelete?.(b)}
                            aria-label={i18n.t('common.delete')}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </Can>
                </div>
            );
        },
    }),
];
