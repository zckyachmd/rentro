'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, FileDown, MoreHorizontal, XCircle } from 'lucide-react';
import React from 'react';

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
import { formatIDR } from '@/lib/format';

import type { CreateColumnsOpts, InvoiceRow } from './types';

const COL = {
    number: 'shrink-0 w-[220px] md:w-[260px] lg:w-[280px]',
    tenant: 'shrink-0 w-[160px] md:w-[200px] lg:w-[260px]',
    room: 'shrink-0 w-[80px] md:w-[100px] lg:w-[120px]',
    due: 'shrink-0 w-[114px] md:w-[140px]',
    status: 'shrink-0 w-[110px] md:w-[130px]',
    amount: 'shrink-0 w-[130px] md:w-[160px] text-right',
    actions: 'shrink-0 w-10 md:w-[48px] text-right',
} as const;

export const createColumns = (opts?: CreateColumnsOpts): ColumnDef<InvoiceRow>[] => [
    makeColumn<InvoiceRow>({
        id: 'number',
        title: 'Nomor',
        className: COL.number,
        sortable: true,
        cell: ({ row }) => {
            const inv = row.original;
            return (
                <div className={`flex items-center gap-2 ${COL.number}`}>
                    <button
                        type="button"
                        className="font-mono text-xs text-left hover:underline"
                        onClick={() => opts?.onShowDetail?.(inv)}
                        aria-label={`Lihat detail ${inv.number}`}
                    >
                        {inv.number}
                    </button>
                </div>
            );
        },
    }),
    makeColumn<InvoiceRow>({
        id: 'tenant',
        title: 'Penyewa',
        className: COL.tenant,
        cell: ({ row }) => (
            <div className={`${COL.tenant} truncate`}>{row.original.tenant ?? '—'}</div>
        ),
    }),
    makeColumn<InvoiceRow>({
        id: 'room',
        title: 'Kamar',
        className: COL.room,
        cell: ({ row }) => (
            <div className={`${COL.room} truncate`}>{row.original.room_number ?? '—'}</div>
        ),
    }),
    makeColumn<InvoiceRow>({
        id: 'due_date',
        title: 'Jatuh Tempo',
        className: COL.due,
        sortable: true,
        cell: ({ row }) => <div className={COL.due}>{row.original.due_date}</div>,
    }),
    makeColumn<InvoiceRow>({
        id: 'status',
        title: 'Status',
        className: COL.status,
        cell: ({ row }) => (
            <div className={COL.status}>
                <Badge
                    variant={
                        row.original.status === 'Paid'
                            ? 'default'
                            : row.original.status === 'Overdue'
                              ? 'destructive'
                              : row.original.status === 'Cancelled'
                                ? 'outline'
                                : 'secondary'
                    }
                >
                    {row.original.status}
                </Badge>
            </div>
        ),
    }),
    makeColumn<InvoiceRow>({
        id: 'amount_cents',
        title: 'Jumlah',
        className: COL.amount,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.amount}>{formatIDR(row.original.amount_cents)}</div>
        ),
    }),
    makeColumn<InvoiceRow>({
        id: 'actions',
        title: 'Aksi',
        className: COL.actions,
        cell: ({ row }) => {
            const inv = row.original;
            return (
                <div className={COL.actions}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${inv.number}`}>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => opts?.onShowDetail?.(inv)}>
                                <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a
                                    href={`${route('management.invoices.print', inv.id)}?auto=1`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <FileDown className="mr-2 h-4 w-4" /> Cetak PDF
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(inv.status === 'Pending' || inv.status === 'Overdue') && (
                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => opts?.onCancel?.(inv)}>
                                    <XCircle className="mr-2 h-4 w-4" /> Batalkan
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    }),
];

export const columns: ColumnDef<InvoiceRow>[] = createColumns();
