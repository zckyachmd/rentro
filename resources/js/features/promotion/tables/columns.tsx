import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import React from 'react';

import { Can } from '@/components/acl';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import type { PromotionItem } from '@/types/management';

export function createColumns(opts: {
    onEdit: (it: PromotionItem) => void;
    onDelete: (it: PromotionItem) => void;
}): ColumnDef<PromotionItem>[] {
    return [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => {
                const it = row.original as PromotionItem;
                return (
                    <a
                        href={route('management.promotions.show', it.id)}
                        className="text-primary hover:underline"
                    >
                        {it.name}
                    </a>
                );
            },
        },
        {
            accessorKey: 'slug',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Slug" />
            ),
        },
        {
            accessorKey: 'stack_mode',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Stack" />
            ),
        },
        {
            accessorKey: 'default_channel',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Channel" />
            ),
        },
        {
            accessorKey: 'priority',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Priority" />
            ),
        },
        {
            accessorKey: 'is_active',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Active" />
            ),
            cell: ({ row }) => (row.original.is_active ? 'Yes' : 'No'),
        },
        {
            id: 'actions',
            enableHiding: false,
            cell: ({ row }) => {
                const it = row.original as PromotionItem;
                return (
                    <div className="flex items-center gap-2 justify-end">
                        <Can all={[`promotion.update`]}>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => opts.onEdit(it)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </Can>
                        <Can all={[`promotion.delete`]}>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => opts.onDelete(it)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </Can>
                    </div>
                );
            },
        },
    ];
}
