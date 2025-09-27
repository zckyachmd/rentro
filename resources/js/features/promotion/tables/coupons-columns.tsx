/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import i18n from '@/lib/i18n';
import { CopyInline } from '@/components/ui/copy-inline';

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
                <DataTableColumnHeader column={column as any} title={i18n.t('management/promotions:coupon.label.code')} />
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs">{row.original.code}</span>
                    <CopyInline value={row.original.code} as="span" variant="icon" size="xs" title={i18n.t('common.copy', 'Copy')} aria-label={i18n.t('common.copy', 'Copy')} />
                </div>
            ),
        },
        { accessorKey: 'is_active', header: i18n.t('common.active', 'Active'), cell: ({ row }) => (row.original.is_active ? i18n.t('common.yes') : i18n.t('common.no')) },
        { accessorKey: 'max_redemptions', header: i18n.t('common.max', 'Maximum'), cell: ({ row }) => (row.original.max_redemptions ?? '-') },
        { accessorKey: 'redeemed_count', header: i18n.t('management/promotions:coupon.label.redeemed', 'Redeemed') },
        { accessorKey: 'expires_at', header: i18n.t('management/promotions:coupon.label.expires_at'), cell: ({ row }) => (row.original.expires_at ? row.original.expires_at : '-') },
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
