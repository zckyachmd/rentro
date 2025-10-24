'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { makeColumn } from '@/components/ui/data-table-column-header';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import i18n from '@/lib/i18n';
import type { ActivityItem } from '@/types/management';

const COL = {
    id: 'shrink-0 w-[72px]',
    time: 'shrink-0 w-[148px] md:w-[168px]',
    user: 'shrink-0 w-[200px] md:w-[232px] lg:w-[256px]',
    subject: 'shrink-0 w-[200px] md:w-[232px] lg:w-[256px]',
    event: 'shrink-0 w-[112px] md:w-[132px]',
    desc: 'min-w-[240px]',
    actions: 'shrink-0 w-10 md:w-[28px] text-right',
};

export function subjectLabel(
    type?: string | null,
    id?: string | number | null,
) {
    if (!type) return '-';
    const leaf = type.split('\\').pop() || type;
    return `${leaf}${id ? `#${id}` : ''}`;
}

export function createColumns(
    toDetail?: (row: ActivityItem) => void,
): ColumnDef<ActivityItem>[] {
    return [
        makeColumn<ActivityItem>({
            id: 'created_at',
            accessorKey: 'created_at',
            title: i18n.t('common.time'),
            className: COL.time,
            sortable: true,
            cell: ({ row }) => {
                const d = new Date(row.original.created_at);
                const text = isNaN(d.getTime())
                    ? '-'
                    : new Intl.DateTimeFormat(i18n.language, {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          timeZone: 'Asia/Jakarta',
                      }).format(d);
                return (
                    <div className={COL.time + ' whitespace-nowrap'}>
                        {text}
                    </div>
                );
            },
        }),
        makeColumn<ActivityItem>({
            id: 'user',
            accessorKey: 'user',
            title: i18n.t('common.user'),
            className: COL.user,
            cell: ({ row }) => {
                const u = row.original.causer;
                return (
                    <div className={COL.user + ' leading-tight'}>
                        {u?.name ? (
                            <>
                                <div className="max-w-[180px] truncate font-medium">
                                    {u.name}
                                </div>
                                <div className="text-muted-foreground max-w-[200px] truncate text-xs">
                                    {u.email}
                                </div>
                            </>
                        ) : (
                            <span className="text-muted-foreground text-xs">
                                -
                            </span>
                        )}
                    </div>
                );
            },
        }),
        makeColumn<ActivityItem>({
            id: 'subject',
            title: i18n.t('subject', { ns: 'management/audit' }),
            className: COL.subject,
            cell: ({ row }) => (
                <div className={COL.subject + ' leading-tight'}>
                    <div className="max-w-[240px] truncate">
                        {subjectLabel(
                            row.original.subject_type,
                            row.original.subject_id,
                        )}
                    </div>
                    {row.original.subject ? (
                        <div className="text-muted-foreground text-xs">
                            {i18n.t('linked', {
                                ns: 'management/audit',
                                defaultValue: 'linked',
                            })}
                        </div>
                    ) : null}
                </div>
            ),
        }),
        makeColumn<ActivityItem>({
            id: 'event',
            title: i18n.t('event', { ns: 'management/audit' }),
            className: COL.event,
            sortable: true,
            cell: ({ row }) => (
                <Badge variant="secondary">{row.original.event || '-'}</Badge>
            ),
        }),
        makeColumn<ActivityItem>({
            id: 'description',
            title: i18n.t('common.description'),
            className: COL.desc,
            cell: ({ row }) => (
                <div
                    className="max-w-[560px] truncate"
                    title={row.original.description ?? ''}
                >
                    {row.original.description ?? '-'}
                </div>
            ),
        }),
        makeColumn<ActivityItem>({
            id: 'actions',
            title: i18n.t('common.actions'),
            className: `${COL.actions} pr-2 md:pr-3 flex justify-end items-center`,
            cell: ({ row }) => (
                <div
                    className={`${COL.actions} flex items-center justify-end pr-2 md:pr-3`}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={i18n.t('common.actions')}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>
                                {i18n.t('common.actions')}
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => toDetail?.(row.original)}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                {i18n.t('common.view_detail')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        }),
    ];
}

export const columns: ColumnDef<ActivityItem>[] = createColumns();
