/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import i18n from '@/lib/i18n';

export type ScopeRow = {
    id: number;
    scope_type: 'global' | 'building' | 'floor' | 'room_type' | 'room';
    building_id?: number | null;
    floor_id?: number | null;
    room_type_id?: number | null;
    room_id?: number | null;
};

type Resolvers = {
    building?: (id?: number | null) => string;
    floor?: (id?: number | null) => string;
    room_type?: (id?: number | null) => string;
    room?: (id?: number | null) => string;
};

export function createScopeColumns(opts: {
    onEdit: (it: ScopeRow) => void;
    onDelete: (it: ScopeRow) => void;
    resolvers?: Resolvers;
}): ColumnDef<unknown>[] {
    return [
        {
            accessorKey: 'scope_type',
            header: ({ column }) => (
                <DataTableColumnHeader column={column as any} title={i18n.t('management/promotions:scope.label.scope_type')} />
            ),
            cell: ({ row }) => {
                const raw = String(row.original.scope_type || '').trim();
                const key = raw.replace(/\s+/g, '_').toLowerCase();
                const map: Record<string, string> = {
                    global: i18n.t('management/promotions:scope.label.scope_type'),
                    building: i18n.t('management/promotions:scope.label.building'),
                    floor: i18n.t('management/promotions:scope.label.floor'),
                    room_type: i18n.t('management/promotions:scope.label.room_type'),
                    room: i18n.t('management/promotions:scope.label.room'),
                };
                return map[key] ?? raw;
            },
        },
        { accessorKey: 'building_id', header: i18n.t('management/promotions:scope.label.building'), cell: ({ row }) => (opts.resolvers?.building?.(row.original.building_id) ?? row.original.building_id ?? '-') },
        { accessorKey: 'floor_id', header: i18n.t('management/promotions:scope.label.floor'), cell: ({ row }) => (opts.resolvers?.floor?.(row.original.floor_id) ?? row.original.floor_id ?? '-') },
        { accessorKey: 'room_type_id', header: i18n.t('management/promotions:scope.label.room_type'), cell: ({ row }) => (opts.resolvers?.room_type?.(row.original.room_type_id) ?? row.original.room_type_id ?? '-') },
        { accessorKey: 'room_id', header: i18n.t('management/promotions:scope.label.room'), cell: ({ row }) => (opts.resolvers?.room?.(row.original.room_id) ?? row.original.room_id ?? '-') },
        {
            id: 'actions',
            enableHiding: false,
            header: ({ column }) => (
                <div className="text-right">
                    <DataTableColumnHeader column={column as any} title={i18n.t('common.actions')} />
                </div>
            ),
            cell: ({ row }) => {
                const it = row.original;
                return (
                    <div className="flex items-center gap-2 justify-end">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => opts.onEdit(it)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => opts.onDelete(it)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];
}
