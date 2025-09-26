import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

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
}): ColumnDef<RuleRow>[] {
    return [
        {
            accessorKey: 'min_spend_idr',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Min Spend" />
            ),
        },
        { accessorKey: 'max_discount_idr', header: 'Max Disc' },
        {
            accessorKey: 'billing_periods',
            header: 'Periods',
            cell: ({ row }) => (row.original.billing_periods || []).join(','),
        },
        { accessorKey: 'channel', header: 'Channel' },
        {
            accessorKey: 'first_n_periods',
            header: 'First N',
            cell: ({ row }) => row.original.first_n_periods ?? '-',
        },
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

