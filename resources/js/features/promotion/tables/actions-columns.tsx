/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import i18n from '@/lib/i18n';

export type ActionRow = {
    id: number;
    action_type: string;
    applies_to_rent: boolean;
    applies_to_deposit: boolean;
    percent_bps?: number | null;
    amount_idr?: number | null;
    fixed_price_idr?: number | null;
    n_days?: number | null;
    n_periods?: number | null;
    max_discount_idr?: number | null;
    priority: number;
};

export function createActionColumns(opts: {
    onEdit: (it: ActionRow) => void;
    onDelete: (it: ActionRow) => void;
}): ColumnDef<unknown>[] {
    return [
        {
            accessorKey: 'action_type',
            header: ({ column }) => (
                <DataTableColumnHeader column={column as any} title={i18n.t('management/promotions:action.label.action_type')} />
            ),
            cell: ({ row }) => {
                const raw = String(row.original.action_type || '').trim().toLowerCase();
                const key = raw.startsWith('first_n_periods_')
                    ? `first_n_${raw.replace('first_n_periods_', '')}`
                    : raw;
                return <span>{i18n.t(`management/promotions:action.type.${key}`, { defaultValue: raw || '-' })}</span>;
            },
        },
        { accessorKey: 'priority', header: i18n.t('management/promotions:action.label.priority') },
        { accessorKey: 'percent_bps', header: i18n.t('management/promotions:action.label.percent_bps'), cell: ({ row }) => row.original.percent_bps ?? '-' },
        { accessorKey: 'amount_idr', header: i18n.t('management/promotions:action.label.amount_idr'), cell: ({ row }) => row.original.amount_idr ?? '-' },
        { accessorKey: 'fixed_price_idr', header: i18n.t('management/promotions:action.label.fixed_price_idr'), cell: ({ row }) => row.original.fixed_price_idr ?? '-' },
        { accessorKey: 'n_days', header: i18n.t('management/promotions:action.label.n_days'), cell: ({ row }) => row.original.n_days ?? '-' },
        { accessorKey: 'n_periods', header: i18n.t('management/promotions:action.label.n_periods'), cell: ({ row }) => row.original.n_periods ?? '-' },
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
