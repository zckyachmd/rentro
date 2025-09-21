'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { makeColumn } from '@/components/ui/data-table-column-header';
import type { ActivityItem } from '@/types/management';

const COL = {
    id: 'shrink-0 w-[80px]',
    time: 'shrink-0 w-[160px]',
    user: 'shrink-0 w-[200px]',
    subject: 'shrink-0 w-[240px]',
    event: 'shrink-0 w-[120px]',
    desc: 'min-w-[200px]',
    actions: 'shrink-0 w-[96px] text-right',
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
            title: 'Waktu',
            className: COL.time,
            sortable: true,
            cell: ({ row }) => (
                <div className={COL.time + ' whitespace-nowrap'}>
                    {new Date(row.original.created_at).toLocaleString('id-ID')}
                </div>
            ),
        }),
        makeColumn<ActivityItem>({
            id: 'user',
            accessorKey: 'user',
            title: 'Pengguna',
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
                                <div className="max-w-[200px] truncate text-xs text-muted-foreground">
                                    {u.email}
                                </div>
                            </>
                        ) : (
                            <span className="text-xs text-muted-foreground">
                                -
                            </span>
                        )}
                    </div>
                );
            },
        }),
        makeColumn<ActivityItem>({
            id: 'subject',
            title: 'Subject',
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
                        <div className="text-xs text-muted-foreground">
                            linked
                        </div>
                    ) : null}
                </div>
            ),
        }),
        makeColumn<ActivityItem>({
            id: 'event',
            title: 'Event',
            className: COL.event,
            sortable: true,
            cell: ({ row }) => (
                <Badge variant="secondary">{row.original.event || '-'}</Badge>
            ),
        }),
        makeColumn<ActivityItem>({
            id: 'description',
            title: 'Deskripsi',
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
            title: 'Aksi',
            className: COL.actions + ' flex justify-end items-center',
            cell: ({ row }) => (
                <div className={COL.actions + ' flex items-center justify-end'}>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => toDetail?.(row.original)}
                        className="flex items-center gap-1"
                    >
                        <Eye className="h-4 w-4" />
                        Detail
                    </Button>
                </div>
            ),
        }),
    ];
}

export const columns: ColumnDef<ActivityItem>[] = createColumns();
