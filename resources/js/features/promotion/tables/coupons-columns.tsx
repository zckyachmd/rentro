/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CopyInline } from '@/components/ui/copy-inline';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import i18n from '@/lib/i18n';

export type CouponRow = {
    id: number;
    code: string;
    is_active: boolean;
    max_redemptions?: number | null;
    redeemed_count: number;
    expires_at?: string | null;
};

export function createCouponColumns(opts: {
    onEdit: (it: CouponRow) => void;
    onDelete: (it: CouponRow) => void;
}): ColumnDef<unknown>[] {
    return [
        {
            accessorKey: 'code',
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column as any}
                    title={i18n.t('management/promotions:coupon.label.code')}
                />
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs">
                        {(row.original as CouponRow).code}
                    </span>
                    <CopyInline
                        value={(row.original as CouponRow).code}
                        as="span"
                        variant="icon"
                        size="xs"
                        title={i18n.t('common.copy', 'Copy')}
                        aria-label={i18n.t('common.copy', 'Copy')}
                    />
                </div>
            ),
        },
        {
            accessorKey: 'is_active',
            header: i18n.t('common.active', 'Active'),
            cell: ({ row }) =>
                (row.original as CouponRow).is_active
                    ? i18n.t('common.yes')
                    : i18n.t('common.no'),
        },
        {
            accessorKey: 'max_redemptions',
            header: i18n.t('common.max', 'Maximum'),
            cell: ({ row }) =>
                (row.original as CouponRow).max_redemptions ?? '-',
        },
        {
            accessorKey: 'redeemed_count',
            header: i18n.t(
                'management/promotions:coupon.label.redeemed',
                'Redeemed',
            ),
        },
        {
            accessorKey: 'expires_at',
            header: i18n.t('management/promotions:coupon.label.expires_at'),
            cell: ({ row }) =>
                (row.original as CouponRow).expires_at
                    ? (row.original as CouponRow).expires_at
                    : '-',
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
                const it = row.original as CouponRow;
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
