'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { CreditCard, Eye, MoreHorizontal, Printer } from 'lucide-react';

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
import { formatDate, formatIDR } from '@/lib/format';
import { variantForInvoiceStatus } from '@/lib/status';

export interface TenantInvoiceItem {
    id: string;
    number: string;
    due_date?: string | null;
    amount_cents: number;
    outstanding_cents: number;
    status: string;
    room_number?: string | null;
}

const COL = {
    number: 'shrink-0 w-[160px]',
    due: 'shrink-0 w-[140px]',
    room: 'shrink-0 w-[110px]',
    amount: 'shrink-0 w-[140px] text-right',
    outstanding: 'shrink-0 w-[140px] text-right',
    status: 'shrink-0 w-[120px]',
    actions: 'shrink-0 w-10 md:w-[48px] text-right',
};

export type ColumnFactoryOptions = {
    onPay?: (row: TenantInvoiceItem) => void;
    onView?: (row: TenantInvoiceItem) => void;
    onPrint?: (row: TenantInvoiceItem) => void;
};

export const createColumns = (
    opts?: ColumnFactoryOptions,
): ColumnDef<TenantInvoiceItem>[] => [
    makeColumn<TenantInvoiceItem>({
        id: 'number',
        accessorKey: 'number',
        title: 'No. Invoice',
        className: COL.number,
        cell: ({ row, getValue }) => (
            <button
                type="button"
                onClick={() => opts?.onView?.(row.original)}
                className={
                    COL.number +
                    ' text-left font-mono text-primary hover:underline'
                }
                title="Lihat rincian invoice"
            >
                {String(getValue() ?? '')}
            </button>
        ),
    }),
    makeColumn<TenantInvoiceItem>({
        id: 'due_date',
        accessorKey: 'due_date',
        title: 'Jatuh Tempo',
        className: COL.due,
        sortable: true,
        cell: ({ getValue }) => (
            <div className={COL.due}>{formatDate(getValue() as string)}</div>
        ),
    }),
    makeColumn<TenantInvoiceItem>({
        id: 'room_number',
        accessorKey: 'room_number',
        title: 'Kamar',
        className: COL.room,
        cell: ({ getValue }) => (
            <div className={COL.room}>{String(getValue() ?? '-')}</div>
        ),
    }),
    makeColumn<TenantInvoiceItem>({
        id: 'amount_cents',
        accessorKey: 'amount_cents',
        title: 'Nominal',
        className: COL.amount,
        sortable: true,
        cell: ({ getValue }) => (
            <div className={COL.amount}>
                {formatIDR(Number(getValue() || 0))}
            </div>
        ),
    }),
    makeColumn<TenantInvoiceItem>({
        id: 'outstanding_cents',
        accessorKey: 'outstanding_cents',
        title: 'Sisa',
        className: COL.outstanding,
        sortable: true,
        cell: ({ getValue }) => {
            const v = Number(getValue() || 0);
            return (
                <div className={COL.outstanding}>
                    {v <= 0 ? 'Lunas' : formatIDR(v)}
                </div>
            );
        },
    }),
    makeColumn<TenantInvoiceItem>({
        id: 'status',
        accessorKey: 'status',
        title: 'Status',
        className: COL.status,
        sortable: true,
        cell: ({ getValue }) => (
            <div className={COL.status}>
                <Badge variant={variantForInvoiceStatus(String(getValue()))}>
                    {String(getValue())}
                </Badge>
            </div>
        ),
    }),
    makeColumn<TenantInvoiceItem>({
        id: 'actions',
        title: 'Aksi',
        className: COL.actions + ' flex justify-end items-center',
        cell: ({ row }) => {
            const r = row.original as TenantInvoiceItem;
            const canPay =
                (r.status === 'Pending' || r.status === 'Overdue') &&
                r.outstanding_cents > 0;
            return (
                <div className={COL.actions + ' flex items-center justify-end'}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Aksi invoice ${r.number}`}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => opts?.onView?.(r)}>
                                <Eye className="mr-2 h-4 w-4" /> Lihat rincian
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => opts?.onPrint?.(r)}
                            >
                                <Printer className="mr-2 h-4 w-4" /> Cetak
                                invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                disabled={!canPay}
                                onClick={() => opts?.onPay?.(r)}
                            >
                                <CreditCard className="mr-2 h-4 w-4" /> Bayar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    }),
];

export const columns: ColumnDef<TenantInvoiceItem>[] = createColumns();
