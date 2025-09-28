/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import i18n from '@/lib/i18n';

export type RuleRow = {
    id: number;
    min_spend_idr?: number | null;
    max_discount_idr?: number | null;
    applies_to_rent: boolean;
    applies_to_deposit: boolean;
    billing_periods: string[];
    channel?: string | null;
    first_n_periods?: number | null;
};

export function createRuleColumns(opts: {
    onEdit: (it: RuleRow) => void;
    onDelete: (it: RuleRow) => void;
}): ColumnDef<unknown>[] {
    return [
        {
            accessorKey: 'min_spend_idr',
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column as any}
                    title={i18n.t('management/promotions:rule.label.min_spend')}
                />
            ),
            cell: ({ row }) => (row.original as RuleRow).min_spend_idr ?? '-',
        },
        {
            accessorKey: 'max_discount_idr',
            header: i18n.t('management/promotions:rule.label.max_discount'),
            cell: ({ row }) =>
                (row.original as RuleRow).max_discount_idr ?? '-',
        },
        {
            accessorKey: 'billing_periods',
            header: i18n.t('management/promotions:rule.label.billing_periods'),
            cell: ({ row }) => {
                const list = Array.isArray(
                    (row.original as RuleRow).billing_periods,
                )
                    ? (row.original as RuleRow).billing_periods
                    : [];
                return list.length
                    ? list
                          .map((p: string) =>
                              p === 'daily'
                                  ? i18n.t('common.daily')
                                  : p === 'weekly'
                                    ? i18n.t('common.weekly')
                                    : i18n.t('common.monthly'),
                          )
                          .join(', ')
                    : '-';
            },
        },
        {
            accessorKey: 'channel',
            header: i18n.t('management/promotions:rule.label.channel'),
            cell: ({ row }) => {
                const raw = ((row.original as RuleRow).channel || '').trim();
                if (!raw) return i18n.t('management/promotions:common.any');
                const key = raw.replace(/\s+/g, '_').toLowerCase();
                return i18n.t(`management/promotions:channel.${key}`, {
                    defaultValue: raw,
                });
            },
        },
        {
            accessorKey: 'first_n_periods',
            header: i18n.t('management/promotions:rule.label.first_n'),
            cell: ({ row }) => (row.original as RuleRow).first_n_periods ?? '-',
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
                const it = row.original as RuleRow;
                return (
                    <div className="flex items-center justify-end gap-2">
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
