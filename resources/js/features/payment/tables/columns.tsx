'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
    CheckCircle2,
    Eye,
    MoreHorizontal,
    Printer,
    XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { makeColumn } from '@/components/ui/data-table-column-header';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import i18n from '@/lib/i18n';
import { variantForPaymentStatus } from '@/lib/status';
import type { PaymentRow } from '@/types/management';

const COL = {
    date: 'shrink-0 w-[124px] md:w-[160px]',
    invoice: 'shrink-0 w-[160px] md:w-[200px] lg:w-[240px]',
    tenant: 'shrink-0 w-[160px] md:w-[220px] lg:w-[280px] truncate',
    method: 'shrink-0 w-[120px]',
    status: 'shrink-0 w-[120px]',
    amount: 'shrink-0 w-[140px] text-right',
    actions: 'shrink-0 w-10 md:w-[48px] text-right',
} as const;

export const createColumns = (opts?: {
    onPrint?: (row: PaymentRow) => void;
    onVoid?: (row: PaymentRow) => void;
    onShowDetail?: (row: PaymentRow) => void;
    onReview?: (row: PaymentRow) => void;
    currency?: (amount: number) => string;
}): ColumnDef<PaymentRow>[] => [
    makeColumn<PaymentRow>({
        id: 'paid_at',
        accessorKey: 'paid_at',
        title: i18n.t('payment.form.paid_at'),
        className: COL.date,
        sortable: true,
        cell: ({ row }) => {
            const p = row.original;
            const clickable =
                (p.status || '').trim().toLowerCase() === 'completed' &&
                !!p.paid_at;
            if (!clickable) {
                return <div className={COL.date}>{p.paid_at ?? '—'}</div>;
            }
            return (
                <button
                    type="button"
                    onClick={() => opts?.onShowDetail?.(p)}
                    className={`${COL.date} text-primary truncate text-left hover:underline`}
                    title={i18n.t('common.view_detail')}
                >
                    {p.paid_at}
                </button>
            );
        },
    }),
    makeColumn<PaymentRow>({
        id: 'invoice',
        accessorKey: 'invoice',
        title: i18n.t('invoice.number_label'),
        className: COL.invoice,
        cell: ({ row }) => (
            <div className={`${COL.invoice} truncate`}>
                {row.original.invoice ?? '—'}
            </div>
        ),
    }),
    makeColumn<PaymentRow>({
        id: 'tenant',
        accessorKey: 'tenant',
        title: i18n.t('common.tenant'),
        className: COL.tenant,
        cell: ({ row }) => (
            <div className={`${COL.tenant} truncate`}>
                {row.original.tenant ?? '—'}
            </div>
        ),
    }),
    makeColumn<PaymentRow>({
        id: 'method',
        accessorKey: 'method',
        title: i18n.t('payment.form.method'),
        className: COL.method,
        sortable: true,
        cell: ({ row }) => {
            const raw = row.original.method || '';
            const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
            const label = i18n.t(`payment.method.${key}`, {
                ns: 'enum',
                defaultValue: raw,
            });
            return <div className={COL.method}>{label}</div>;
        },
    }),
    makeColumn<PaymentRow>({
        id: 'status',
        accessorKey: 'status',
        title: i18n.t('common.status'),
        className: COL.status,
        sortable: true,
        cell: ({ row }) => {
            const raw = row.original.status || '';
            const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
            const label = i18n.t(`payment.status.${key}`, {
                ns: 'enum',
                defaultValue: raw,
            });
            return (
                <div className={COL.status}>
                    <Badge variant={variantForPaymentStatus(raw)}>
                        {label}
                    </Badge>
                </div>
            );
        },
    }),
    makeColumn<PaymentRow>({
        id: 'amount_cents',
        accessorKey: 'amount_cents',
        title: i18n.t('common.amount'),
        className: COL.amount,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.amount}>
                {opts?.currency
                    ? opts.currency(row.original.amount_cents)
                    : String(row.original.amount_cents)}
            </div>
        ),
    }),
    makeColumn<PaymentRow>({
        id: 'actions',
        title: i18n.t('common.actions'),
        className: COL.actions,
        cell: ({ row }) => {
            const p = row.original;
            return (
                <div className={`${COL.actions} flex items-center justify-end`}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={i18n.t('payment.actions_for', {
                                    invoice: p.invoice ?? '',
                                })}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                {i18n.t('common.actions')}
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => opts?.onShowDetail?.(p)}
                            >
                                <Eye className="mr-2 h-4 w-4" />{' '}
                                {i18n.t('common.view_detail')}
                            </DropdownMenuItem>
                            {(p.method || '').trim().toLowerCase() ===
                                'transfer' &&
                            (p.status || '').trim().toLowerCase() ===
                                'review' ? (
                                <>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            opts?.onReview
                                                ? opts.onReview(p)
                                                : opts?.onShowDetail?.(p)
                                        }
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />{' '}
                                        {i18n.t('payment.review.action')}
                                    </DropdownMenuItem>
                                </>
                            ) : null}
                            {(p.status || '').trim().toLowerCase() ===
                            'completed' ? (
                                <>
                                    <DropdownMenuItem
                                        onClick={() => opts?.onPrint?.(p)}
                                    >
                                        <Printer className="mr-2 h-4 w-4" />{' '}
                                        {i18n.t('payment.print_receipt')}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => opts?.onVoid?.(p)}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />{' '}
                                        {i18n.t('payment.void.title')}
                                    </DropdownMenuItem>
                                </>
                            ) : null}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    }),
];

export const columns: ColumnDef<PaymentRow>[] = createColumns();
