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
import type { AmenityItem } from '@/types/management';

const COL = {
    name: 'shrink-0 w-[240px] md:w-[320px] lg:w-[380px]',
    category: 'shrink-0 w-[140px] md:w-[180px]',
    icon: 'shrink-0 w-[140px] md:w-[180px]',
    actions: 'shrink-0 w-[96px] md:w-[110px] text-right ml-auto',
} as const;

export const createColumns = (opts?: {
    onEdit?: (a: AmenityItem) => void;
    onDelete?: (a: AmenityItem) => void;
}): ColumnDef<AmenityItem>[] => [
    makeColumn<AmenityItem>({
        id: 'name',
        accessorKey: 'name',
        title: i18n.t('common.name'),
        className: COL.name,
        sortable: true,
        cell: ({ getValue }) => (
            <div className={COL.name}>{String(getValue() ?? '')}</div>
        ),
    }),
    makeColumn<AmenityItem>({
        id: 'category',
        accessorKey: 'category',
        title: i18n.t('form.category', { ns: 'management/amenities' }),
        className: COL.category,
        sortable: true,
        cell: ({ getValue }) => {
            const v = String(getValue() ?? '') as 'room' | 'communal' | '';
            const label = v
                ? i18n.t(`amenity_category.${v}`, { ns: 'enum' })
                : '—';
            return <div className={COL.category}>{label}</div>;
        },
    }),
    makeColumn<AmenityItem>({
        id: 'icon',
        accessorKey: 'icon',
        title: i18n.t('common.icon'),
        className: COL.icon,
        cell: ({ getValue }) => (
            <code className={`${COL.icon} text-xs`}>
                {String(getValue() ?? '')}
            </code>
        ),
    }),
    makeColumn<AmenityItem>({
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
                            <Can all={['amenity.update']}>
                                <DropdownMenuItem
                                    onClick={() => opts?.onEdit?.(a)}
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {i18n.t('common.edit')}
                                </DropdownMenuItem>
                            </Can>
                            <DropdownMenuSeparator />
                            <Can all={['amenity.delete']}>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => opts?.onDelete?.(a)}
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
    }),
];
