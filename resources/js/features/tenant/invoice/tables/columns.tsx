'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, CreditCard, MoreHorizontal, Printer } from 'lucide-react';

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
import { variantForInvoiceStatus } from '@/lib/status';
import type { TenantInvoiceItem } from '@/types/tenant';

const COL = {
    number: 'shrink-0 w-[200px] md:w-[240px] lg:w-[280px]',
    due: 'shrink-0 w-[114px] md:w-[140px]',
    status: 'shrink-0 w-[110px] md:w-[130px]',
    amount: 'shrink-0 w-[130px] md:w-[160px] text-right',
    outstanding: 'shrink-0 w-[130px] md:w-[160px] text-right',
    actions: 'shrink-0 w-10 md:w-[48px] text-right',
} as const;

export const createColumns = (opts?: {
    onShowDetail?: (row: TenantInvoiceItem) => void;
    onPay?: (row: TenantInvoiceItem) => void;
}): ColumnDef<TenantInvoiceItem>[] => [
    makeColumn<TenantInvoiceItem>({
        id: 'number',
        title: 'Nomor',
        className: COL.number,
        sortable: true,
        cell: ({ row }) => (
            <div className={`flex items-center gap-2 ${COL.number}`}>
                <button
                    type="button"
                    className="text-left font-mono text-xs hover:underline"
                    onClick={() => opts?.onShowDetail?.(row.original)}
                    aria-label={`Lihat detail ${row.original.number}`}
                >
                    {row.original.number}
                </button>
            </div>
        ),
    }),
    makeColumn<TenantInvoiceItem>({
        id: 'due_date',
        title: 'Jatuh Tempo',
        className: COL.due,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.due}>{row.original.due_date}</div>
        ),
    }),
    makeColumn<TenantInvoiceItem>({
        id: 'status',
        title: 'Status',
        className: COL.status,
        cell: ({ row }) => (
            <div className={COL.status}>
                <Badge variant={variantForInvoiceStatus(row.original.status)}>
                    {row.original.status}
                </Badge>
            </div>
        ),
    }),
    makeColumn<TenantInvoiceItem>({
        id: 'amount_cents',
        title: 'Jumlah',
        className: COL.amount,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.amount}>
                {formatIDR(row.original.amount_cents)}
            </div>
        ),
    }),
    makeColumn<TenantInvoiceItem>({
        id: 'outstanding_cents',
        title: 'Sisa',
        className: COL.outstanding,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.outstanding}>
                {formatIDR(row.original.outstanding_cents)}
            </div>
        ),
    }),
    makeColumn<TenantInvoiceItem>({
        id: 'actions',
        title: 'Aksi',
        className: COL.actions,
        cell: ({ row }) => {
            const inv = row.original;
            const canPay = (inv.outstanding_cents ?? 0) > 0 && inv.status !== 'Cancelled';
            return (
                <div className={`${COL.actions} flex items-center justify-end`}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Aksi invoice ${inv.number}`}>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => opts?.onShowDetail?.(inv)}>
                                <Eye className="mr-2 h-4 w-4" /> Lihat detail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    window.open(
                                        route('tenant.invoices.print', inv.id),
                                        '_blank',
                                    )
                                }
                            >
                                <Printer className="mr-2 h-4 w-4" /> Cetak
                            </DropdownMenuItem>
                            {canPay ? (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => opts?.onPay?.(inv)}>
                                        <CreditCard className="mr-2 h-4 w-4" /> Bayar
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

export const columns: ColumnDef<TenantInvoiceItem>[] = createColumns();
