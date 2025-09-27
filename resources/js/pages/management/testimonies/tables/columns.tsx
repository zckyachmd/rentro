import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TestimonyItem } from '@/types/management';

export function createColumns({
    onCurate,
    onDelete,
    tEnum,
}: {
    onCurate: (item: TestimonyItem) => void;
    onDelete: (item: TestimonyItem) => void;
    tEnum: (k: string, d?: string) => string;
}): ColumnDef<TestimonyItem>[] {
    return [
        {
            header: 'User',
            accessorKey: 'user.name',
            cell: ({ row }) => row.original.user?.name ?? '-',
            enableSorting: false,
        },
        {
            header: 'Original',
            accessorKey: 'content_original',
            cell: ({ row }) => (
                <p className="text-muted-foreground line-clamp-2 max-w-[420px] text-sm">
                    {row.original.content_original}
                </p>
            ),
            enableSorting: false,
        },
        {
            header: 'Curated',
            accessorKey: 'content_curated',
            cell: ({ row }) => (
                <p className="line-clamp-2 max-w-[420px] text-sm">
                    {row.original.content_curated ?? '-'}
                </p>
            ),
            enableSorting: false,
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ row }) => {
                const s = row.original.status;
                const variant:
                    | 'default'
                    | 'secondary'
                    | 'destructive'
                    | 'outline' =
                    s === 'published'
                        ? 'default'
                        : s === 'approved'
                          ? 'secondary'
                          : s === 'rejected'
                            ? 'destructive'
                            : 'outline';
                return (
                    <Badge variant={variant}>
                        {tEnum(`testimony_status.${s}`, s)}
                    </Badge>
                );
            },
            enableSorting: true,
        },
        {
            header: 'Actions',
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onCurate(row.original)}
                        title="Curate"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDelete(row.original)}
                        title="Delete"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
            enableSorting: false,
        },
    ];
}
