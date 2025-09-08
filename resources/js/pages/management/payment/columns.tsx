'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Printer, XCircle } from 'lucide-react';

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
import { variantForPaymentStatus } from '@/lib/status';

import type { PaymentRow } from '.';

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
    currency?: (amount: number) => string;
}): ColumnDef<PaymentRow>[] => [
    makeColumn<PaymentRow>({
        id: 'paid_at',
        accessorKey: 'paid_at',
        title: 'Tanggal',
        className: COL.date,
        sortable: true,
        cell: ({ row }) => {
            const p = row.original;
            const clickable = p.status === 'Completed' && !!p.paid_at;
            if (!clickable) {
                return <div className={COL.date}>{p.paid_at ?? '—'}</div>;
            }
            return (
                <button
                    type="button"
                    onClick={() => opts?.onShowDetail?.(p)}
                    className={`${COL.date} truncate text-left text-primary hover:underline`}
                    title="Lihat detail pembayaran"
                >
                    {p.paid_at}
                </button>
            );
        },
    }),
    makeColumn<PaymentRow>({
        id: 'invoice',
        accessorKey: 'invoice',
        title: 'Invoice',
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
        title: 'Penyewa',
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
        title: 'Metode',
        className: COL.method,
        sortable: true,
    }),
    makeColumn<PaymentRow>({
        id: 'status',
        accessorKey: 'status',
        title: 'Status',
        className: COL.status,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.status}>
                <Badge variant={variantForPaymentStatus(row.original.status)}>
                    {row.original.status}
                </Badge>
            </div>
        ),
    }),
    makeColumn<PaymentRow>({
        id: 'amount_cents',
        accessorKey: 'amount_cents',
        title: 'Nominal',
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
        title: 'Aksi',
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
                                aria-label={`Aksi pembayaran ${p.invoice ?? ''}`}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            {p.status === 'Completed' ? (
                                <>
                                    <DropdownMenuItem
                                        onClick={() => opts?.onShowDetail?.(p)}
                                    >
                                        <Eye className="mr-2 h-4 w-4" /> Lihat
                                        Detail
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => opts?.onPrint?.(p)}
                                    >
                                        <Printer className="mr-2 h-4 w-4" />{' '}
                                        Cetak Kwitansi
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => opts?.onVoid?.(p)}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />{' '}
                                        Batalkan
                                    </DropdownMenuItem>
                                </>
                            ) : (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    Tidak ada aksi
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    }),
];

export const columns: ColumnDef<PaymentRow>[] = createColumns();
