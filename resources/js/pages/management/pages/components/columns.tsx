import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { PageItem } from '../types';

export function createColumns(opts: {
    t: (k: string, opts?: Record<string, unknown>) => string;
    tPages: (k: string, opts?: Record<string, unknown>) => string;
    onEdit: (row: PageItem) => void;
}): ColumnDef<PageItem>[] {
    const { t, tPages } = opts;
    return [
        {
            id: 'slug',
            accessorKey: 'slug',
            header: tPages('columns.slug'),
            cell: ({ row }) => (
                <a
                    className="underline"
                    href={route('management.pages.edit', {
                        page: row.original.id,
                    })}
                >
                    {row.original.slug}
                </a>
            ),
        },
        // Keep table minimal: only slug, updated_at, actions
        {
            id: 'updated_at',
            accessorKey: 'updated_at',
            header: tPages('columns.updated_at'),
            cell: ({ row }) =>
                new Date(row.original.updated_at).toLocaleString(),
        },
        {
            id: 'actions',
            header: tPages('columns.actions'),
            cell: ({ row }) => {
                const it = row.original;
                return (
                    <div className="flex items-center justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t('common.actions')}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    {t('common.actions')}
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => opts.onEdit(it)}
                                >
                                    <Pencil className="mr-2 h-4 w-4" />{' '}
                                    {t('common.edit')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];
}
