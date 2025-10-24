'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyInline } from '@/components/ui/copy-inline';
import { makeColumn } from '@/components/ui/data-table-column-header';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatIDR } from '@/lib/format';
import i18n from '@/lib/i18n';

export type BookingRow = {
    id: string;
    number: string;
    status: string;
    start_date: string;
    duration: number;
    period: string;
    promo_code?: string | null;
    tenant?: string | null;
    tenant_email?: string | null;
    room?: string | null;
    building?: string | null;
    type?: string | null;
    estimate?: { total: number } | null;
};

type CreateColumnsOpts<T extends BookingRow> = {
    onDetail?: (row: T) => void;
};

const COL = {
    number: 'shrink-0 w-[156px] md:w-[188px] lg:w-[204px]',
    tenant: 'shrink-0 w-[156px] md:w-[188px] lg:w-[200px]',
    room: 'shrink-0 w-[60px] md:w-[76px] lg:w-[102px]',
    start: 'shrink-0 w-[70px] md:w-[100px]',
    duration: 'shrink-0 w-[50px] md:w-[80px]',
    estimate: 'shrink-0 w-[60px] md:w-[90px]',
    status: 'shrink-0 w-[50px] md:w-[80px]',
    actions: 'shrink-0 w-10 md:w-[48px] text-right',
} as const;

function variantForBookingStatus(status: string) {
    const k = (status || '').trim().toLowerCase().replace(/\s+/g, '_');
    switch (k) {
        case 'approved':
            return 'default' as const;
        case 'rejected':
        case 'cancelled':
            return 'destructive' as const;
        case 'requested':
        default:
            return 'secondary' as const;
    }
}

export const createColumns = <T extends BookingRow>(
    opts?: CreateColumnsOpts<T>,
): ColumnDef<T>[] => [
    makeColumn<T>({
        id: 'number',
        title: i18n.t('common.number'),
        className: COL.number,
        cell: ({ row }) => {
            const b = row.original;
            const t = i18n.t.bind(i18n);
            return (
                <div className={`flex items-center gap-2 ${COL.number}`}>
                    <button
                        type="button"
                        className="text-left font-mono text-xs underline underline-offset-2"
                        onClick={() => opts?.onDetail?.(b)}
                        aria-label={t('common.view_detail') + ' ' + b.number}
                        title={t('common.view_detail')}
                    >
                        {b.number}
                    </button>
                    <CopyInline
                        value={b.number}
                        variant="icon"
                        size="sm"
                        title={t('common.copy')}
                        aria-label={t('common.copy')}
                    />
                </div>
            );
        },
    }),
    makeColumn<T>({
        id: 'tenant',
        title: i18n.t('common.tenant'),
        className: COL.tenant,
        cell: ({ row }) => {
            const name = row.original.tenant ?? '—';
            const email = (row.original as { tenant_email?: string | null })
                .tenant_email;
            return (
                <div className={COL.tenant + ' flex flex-col'}>
                    <span className="truncate font-medium">{name}</span>
                    {email ? (
                        <span className="text-muted-foreground truncate text-xs">
                            {email}
                        </span>
                    ) : null}
                </div>
            );
        },
    }),
    makeColumn<T>({
        id: 'room',
        title: i18n.t('common.room'),
        className: COL.room,
        cell: ({ row }) => (
            <div className={`${COL.room} truncate`}>
                {row.original.room ?? '—'}
            </div>
        ),
    }),
    makeColumn<T>({
        id: 'start_date',
        title: i18n.t('common.start'),
        className: COL.start,
        cell: ({ row }) => (
            <div className={COL.start}>
                {formatDate(row.original.start_date)}
            </div>
        ),
    }),
    makeColumn<T>({
        id: 'duration',
        title: i18n.t('common.duration', { defaultValue: 'Duration' }),
        className: COL.duration,
        cell: ({ row }) => {
            const b = row.original;
            const label = i18n.t(`billing_period.${b.period}`, {
                ns: 'enum',
                defaultValue: b.period,
            });
            return (
                <div className={COL.duration}>
                    {String(b.duration)} × {label}
                </div>
            );
        },
    }),
    makeColumn<T>({
        id: 'estimate',
        title: i18n.t('table.columns.estimate', {
            ns: 'management/booking',
            defaultValue: 'Estimate',
        }),
        className: COL.estimate,
        cell: ({ row }) => (
            <div className={COL.estimate}>
                {formatIDR(row.original.estimate?.total ?? 0)}
            </div>
        ),
    }),
    makeColumn<T>({
        id: 'status',
        title: i18n.t('common.status'),
        className: COL.status,
        cell: ({ row }) => {
            const raw = row.original.status || '';
            const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
            const label = i18n.t(`booking.status.${key}`, {
                ns: 'enum',
                defaultValue: raw,
            });
            return (
                <div className={COL.status}>
                    <Badge variant={variantForBookingStatus(raw)}>
                        {label}
                    </Badge>
                </div>
            );
        },
    }),
    makeColumn<T>({
        id: 'actions',
        title: i18n.t('common.actions'),
        className: `${COL.actions} pr-2 md:pr-3 flex justify-end items-center`,
        cell: ({ row }) => {
            const b = row.original;
            const t = i18n.t.bind(i18n);
            return (
                <div
                    className={`${COL.actions} flex items-center justify-end pr-2 md:pr-3`}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t('table.actions_for', {
                                    ns: 'management/booking',
                                    number: b.number,
                                })}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                {t('common.actions')}
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => opts?.onDetail?.(b)}
                            >
                                <Eye className="mr-2 h-4 w-4" />{' '}
                                {t('common.view_detail')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    }),
];
