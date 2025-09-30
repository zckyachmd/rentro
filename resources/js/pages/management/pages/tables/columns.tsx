import type { ColumnDef } from '@tanstack/react-table';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExternalLink, MoreVertical, Pencil } from 'lucide-react';

export type PageSectionItem = {
    page: string;
    section: string;
    keys: string[];
};

export function createColumns(opts: {
    onEdit: (row: PageSectionItem) => void;
}): ColumnDef<PageSectionItem, unknown>[] {
    const { onEdit } = opts;
    const cols: ColumnDef<PageSectionItem, unknown>[] = [
        {
            accessorKey: 'page',
            header: ({ table }) => {
                void table;
                const { t } = useTranslation('management/pages');
                return <span>{t('table.page')}</span>;
            },
            cell: ({ row }) => (
                <Badge variant="secondary" className="uppercase">
                    {row.original.page}
                </Badge>
            ),
            enableSorting: true,
        },
        {
            accessorKey: 'section',
            header: () => {
                const { t } = useTranslation('management/pages');
                return <span>{t('table.section')}</span>;
            },
            cell: ({ row }) => (
                <span
                    className="font-mono text-xs max-w-[200px] truncate inline-block"
                    title={row.original.section}
                >
                    {row.original.section}
                </span>
            ),
            enableSorting: true,
        },
        {
            id: 'keys',
            header: () => {
                const { t } = useTranslation('management/pages');
                return <span>{t('table.keys')}</span>;
            },
            cell: ({ row }) => {
                const keys = row.original.keys || [];
                const max = 3;
                const shown = keys.slice(0, max);
                const more = keys.length - shown.length;
                return (
                    <div className="flex flex-wrap gap-1">
                        {shown.map((k) => (
                            <Badge key={k} variant="outline">
                                {k}
                            </Badge>
                        ))}
                        {more > 0 ? (
                            <Badge variant="secondary">+{more}</Badge>
                        ) : null}
                    </div>
                );
            },
            enableSorting: false,
        },
        {
            id: 'actions',
            header: () => {
                const { t } = useTranslation();
                return <span>{t('common.actions')}</span>;
            },
            cell: ({ row }) => {
                const { t } = useTranslation();
                const { t: tPages } = useTranslation('management/pages');
                const page = row.original.page;
                const publicUrl = (() => {
                    try {
                        if (page === 'home') return route('home');
                        if (page === 'about') return route('public.about');
                        if (page === 'privacy') return route('public.privacy');
                    } catch {}
                    return page === 'home' ? '/' : `/${page}`;
                })();
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={t('common.actions')}>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(row.original)} className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-2">
                                    <Pencil className="h-4 w-4" /> {t('common.edit')}
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4" /> {tPages('actions.open_public')}
                                </a>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
            enableSorting: false,
        },
    ];
    return cols;
}
