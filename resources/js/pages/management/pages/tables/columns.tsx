import type { ColumnDef, Row } from '@tanstack/react-table';
import { ExternalLink, MoreVertical, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type PageSectionItem = {
    page: string;
    section: string;
    keys: string[];
};

function HeaderLabel({ ns, keyPath }: { ns?: string; keyPath: string }) {
    const { t } = useTranslation(ns);
    return <span>{t(keyPath)}</span>;
}

function ActionsCell({
    row,
    onEdit,
}: {
    row: Row<PageSectionItem>;
    onEdit: (row: PageSectionItem) => void;
}) {
    const { t } = useTranslation();
    const { t: tPages } = useTranslation('management/pages');
    const page = row.original.page;
    const publicUrl = (() => {
        try {
            if (page === 'home') return route('home');
            if (page === 'about') return route('public.about');
            if (page === 'privacy') return route('public.privacy');
            return page === 'home' ? '/' : `/${page}`;
        } catch {
            return page === 'home' ? '/' : `/${page}`;
        }
    })();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('common.actions')}
                >
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => onEdit(row.original)}
                    className="flex items-center gap-2"
                >
                    <span className="inline-flex items-center gap-2">
                        <Pencil className="h-4 w-4" /> {t('common.edit')}
                    </span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                    >
                        <ExternalLink className="h-4 w-4" />{' '}
                        {tPages('actions.open_public')}
                    </a>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function createColumns(opts: {
    onEdit: (row: PageSectionItem) => void;
}): ColumnDef<PageSectionItem, unknown>[] {
    const { onEdit } = opts;
    const cols: ColumnDef<PageSectionItem, unknown>[] = [
        {
            accessorKey: 'page',
            header: ({ table }) => {
                void table;
                return (
                    <HeaderLabel ns="management/pages" keyPath="table.page" />
                );
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
            header: () => (
                <HeaderLabel ns="management/pages" keyPath="table.section" />
            ),
            cell: ({ row }) => (
                <span
                    className="inline-block max-w-[200px] truncate font-mono text-xs"
                    title={row.original.section}
                >
                    {row.original.section}
                </span>
            ),
            enableSorting: true,
        },
        {
            id: 'keys',
            header: () => (
                <HeaderLabel ns="management/pages" keyPath="table.keys" />
            ),
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
            header: () => <HeaderLabel keyPath="common.actions" />,
            cell: ({ row }) => <ActionsCell row={row} onEdit={onEdit} />,
            enableSorting: false,
        },
    ];
    return cols;
}
