import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

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
}): ColumnDef<ActionRow>[] {
    return [
        {
            accessorKey: 'action_type',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Type" />
            ),
        },
        { accessorKey: 'priority', header: 'Priority' },
        { accessorKey: 'percent_bps', header: '% bps' },
        { accessorKey: 'amount_idr', header: 'Amount' },
        { accessorKey: 'fixed_price_idr', header: 'Fixed' },
        { accessorKey: 'n_days', header: 'Free days' },
        { accessorKey: 'n_periods', header: 'First N' },
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

