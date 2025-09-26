import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

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
}): ColumnDef<CouponRow>[] {
    return [
        {
            accessorKey: 'code',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Code" />
            ),
        },
        { accessorKey: 'is_active', header: 'Active', cell: ({ row }) => (row.original.is_active ? 'Yes' : 'No') },
        { accessorKey: 'max_redemptions', header: 'Max' },
        { accessorKey: 'redeemed_count', header: 'Redeemed' },
        { accessorKey: 'expires_at', header: 'Expires' },
        {
            id: 'actions',
            enableHiding: false,
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

