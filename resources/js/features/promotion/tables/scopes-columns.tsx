import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

export type ScopeRow = {
    id: number;
    scope_type: 'global' | 'building' | 'floor' | 'room_type' | 'room';
    building_id?: number | null;
    floor_id?: number | null;
    room_type_id?: number | null;
    room_id?: number | null;
};

export function createScopeColumns(opts: {
    onEdit: (it: ScopeRow) => void;
    onDelete: (it: ScopeRow) => void;
}): ColumnDef<ScopeRow>[] {
    return [
        {
            accessorKey: 'scope_type',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Type" />
            ),
        },
        { accessorKey: 'building_id', header: 'Building' },
        { accessorKey: 'floor_id', header: 'Floor' },
        { accessorKey: 'room_type_id', header: 'Room Type' },
        { accessorKey: 'room_id', header: 'Room' },
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

