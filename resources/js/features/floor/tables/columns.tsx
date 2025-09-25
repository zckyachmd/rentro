'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';

import { Can } from '@/components/acl';
import { Button } from '@/components/ui/button';
import { makeColumn } from '@/components/ui/data-table-column-header';
import i18n from '@/lib/i18n';
import type { FloorItem } from '@/types/management';

const COL = {
    building: 'shrink-0 w-[220px] md:w-[260px] lg:w-[320px]',
    level: 'shrink-0 w-[100px] text-center',
    name: 'w-full',
    actions: 'shrink-0 w-[96px] md:w-[110px] text-right ml-auto',
} as const;

export const createColumns = (opts?: {
    onEdit?: (f: FloorItem) => void;
    onDelete?: (f: FloorItem) => void;
}): ColumnDef<FloorItem>[] => [
    makeColumn<FloorItem>({
        id: 'building',
        accessorKey: 'building.name',
        title: i18n.t('management/room.building', 'Building'),
        className: COL.building,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.building}>
                {row.original.building?.name ?? '—'}
            </div>
        ),
    }),
    makeColumn<FloorItem>({
        id: 'level',
        accessorKey: 'level',
        title: i18n.t('common.level', 'Level'),
        className: COL.level,
        sortable: true,
        cell: ({ getValue }) => (
            <div className={COL.level}>{String(getValue() ?? '')}</div>
        ),
    }),
    makeColumn<FloorItem>({
        id: 'name',
        accessorKey: 'name',
        title: i18n.t('common.name'),
        className: COL.name,
        cell: ({ getValue }) => (
            <div className={COL.name}>{String(getValue() ?? '—')}</div>
        ),
    }),
    makeColumn<FloorItem>({
        id: 'actions',
        title: i18n.t('common.actions'),
        className: COL.actions,
        cell: ({ row }) => {
            const f = row.original;
            return (
                <div className={COL.actions + ' flex justify-end gap-2'}>
                    <Can all={['floor.update']}>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => opts?.onEdit?.(f)}
                            aria-label={i18n.t('common.edit')}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </Can>
                    <Can all={['floor.delete']}>
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => opts?.onDelete?.(f)}
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
