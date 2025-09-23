'use client';

import { Link } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Clock3,
    Eye,
    MoreHorizontal,
    Printer,
    Receipt,
    XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyInline } from '@/components/ui/copy-inline';
import { makeColumn } from '@/components/ui/data-table-column-header';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatIDR } from '@/lib/format';
import i18n from '@/lib/i18n';
import { variantForInvoiceStatus } from '@/lib/status';
import type { BaseInvoiceRow, CreateColumnsOpts } from '@/types/management';

const COL = {
    number: 'shrink-0 w-[220px] md:w-[260px] lg:w-[280px]',
    tenant: 'shrink-0 w-[160px] md:w-[200px] lg:w-[260px]',
    room: 'shrink-0 w-[80px] md:w-[100px] lg:w-[120px]',
    due: 'shrink-0 w-[114px] md:w-[140px]',
    status: 'shrink-0 w-[110px] md:w-[130px]',
    amount: 'shrink-0 w-[130px] md:w-[160px] text-right',
    outstanding: 'shrink-0 w-[130px] md:w-[160px] text-right',
    actions: 'shrink-0 w-10 md:w-[48px] text-right',
} as const;

export const createColumns = <T extends BaseInvoiceRow>(
    opts?: CreateColumnsOpts<T>,
): ColumnDef<T>[] => [
    makeColumn<T>({
        id: 'number',
        title: i18n.t('common.number'),
        className: COL.number,
        sortable: true,
        cell: ({ row }) => {
            const inv = row.original;
            const t = i18n.t.bind(i18n);
            return (
                <div className={`flex items-center gap-2 ${COL.number}`}>
                    <button
                        type="button"
                        className="text-left font-mono text-xs hover:underline"
                        onClick={() => opts?.onShowDetail?.(inv)}
                        aria-label={t('common.view_detail') + ' ' + inv.number}
                        title={t('common.view_detail')}
                    >
                        {inv.number}
                    </button>
                    <CopyInline
                        value={inv.number}
                        variant="icon"
                        size="sm"
                        title={t('invoice.copy_number')}
                        aria-label={t('invoice.copy_number')}
                    />
                </div>
            );
        },
    }),
    makeColumn<T>({
        id: 'tenant',
        title: i18n.t('common.tenant'),
        className: COL.tenant,
        cell: ({ row }) => (
            <div className={`${COL.tenant} truncate`}>
                {row.original.tenant ?? '—'}
            </div>
        ),
    }),
    makeColumn<T>({
        id: 'room',
        title: i18n.t('common.room'),
        className: COL.room,
        cell: ({ row }) => (
            <div className={`${COL.room} truncate`}>
                {row.original.room_number ?? '—'}
            </div>
        ),
    }),
    makeColumn<T>({
        id: 'due_date',
        title: i18n.t('common.due_date'),
        className: COL.due,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.due}>{row.original.due_date}</div>
        ),
    }),
    makeColumn<T>({
        id: 'status',
        title: i18n.t('common.status'),
        className: COL.status,
        cell: ({ row }) => (
            <div className={COL.status}>
                <Badge variant={variantForInvoiceStatus(row.original.status)}>
                    {row.original.status}
                </Badge>
            </div>
        ),
    }),
    makeColumn<T>({
        id: 'amount_cents',
        title: i18n.t('common.amount'),
        className: COL.amount,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.amount}>
                {formatIDR(row.original.amount_cents)}
            </div>
        ),
    }),
    makeColumn<T>({
        id: 'outstanding',
        title: i18n.t('invoice.outstanding'),
        className: COL.outstanding,
        cell: ({ row }) => (
            <div className={COL.outstanding}>
                {formatIDR(row.original.outstanding ?? 0)}
            </div>
        ),
    }),
    makeColumn<T>({
        id: 'actions',
        title: i18n.t('common.actions'),
        className: COL.actions,
        cell: ({ row }) => {
            const inv = row.original;
            const t = i18n.t.bind(i18n);
            return (
                <div className={`${COL.actions} flex items-center justify-end`}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t('invoice.actions_for', {
                                    number: inv.number,
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
                                onClick={() => opts?.onShowDetail?.(inv)}
                            >
                                <Eye className="mr-2 h-4 w-4" />{' '}
                                {t('common.view_detail')}
                            </DropdownMenuItem>
                            {typeof inv.ticket_url === 'string' &&
                            inv.ticket_url ? (
                                <DropdownMenuItem asChild>
                                    <Link href={inv.ticket_url} target="_blank">
                                        <Receipt className="mr-2 h-4 w-4" />
                                        {t('invoice.view_ticket')}
                                    </Link>
                                </DropdownMenuItem>
                            ) : null}
                            {inv.status === 'Overdue' ||
                            inv.status === 'Pending' ? (
                                <DropdownMenuItem
                                    onClick={() => opts?.onExtendDue?.(inv)}
                                >
                                    <Clock3 className="mr-2 h-4 w-4" />{' '}
                                    {t('invoice.extend_due.action')}
                                </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                                onClick={() => opts?.onPrint?.(inv)}
                            >
                                <Printer className="mr-2 h-4 w-4" />{' '}
                                {t('common.print')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {inv.status !== 'Voided' ? (
                                <DropdownMenuItem
                                    onClick={() => opts?.onCancel?.(inv)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <XCircle className="mr-2 h-4 w-4" />{' '}
                                    {t('common.cancel')}
                                </DropdownMenuItem>
                            ) : null}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    }),
];
