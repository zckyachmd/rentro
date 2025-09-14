'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, ReceiptText, RefreshCcw } from 'lucide-react';

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
import { variantForContractStatus } from '@/lib/status';

export interface TenantContractItem {
    id: string;
    room?: { id: string; number: string } | null;
    start_date?: string | null;
    end_date?: string | null;
    rent_cents: number;
    status: string;
    auto_renew: boolean;
}

const COL = {
    room: 'shrink-0 w-[110px]',
    start: 'shrink-0 w-[120px]',
    end: 'shrink-0 w-[120px]',
    rent: 'shrink-0 w-[140px] text-right',
    status: 'shrink-0 w-[120px]',
    daysLeft: 'shrink-0 w-[120px] text-right',
    renew: 'shrink-0 w-[120px]',
    actions: 'shrink-0 w-10 md:w-[48px] text-right',
};

export type ColumnFactoryOptions = {
    onStopAutoRenew?: (row: TenantContractItem) => void;
};

export const createColumns = (
    opts?: ColumnFactoryOptions,
): ColumnDef<TenantContractItem>[] => [
    makeColumn<TenantContractItem>({
        id: 'room',
        title: 'Kamar',
        className: COL.room,
        cell: ({ row }) => {
            const href = route('tenant.contracts.show', {
                contract: row.original.id,
            });
            return (
                <div className={COL.room}>
                    {row.original.room?.number ? (
                        <a
                            href={href}
                            className="underline underline-offset-2 hover:opacity-80"
                        >
                            {row.original.room.number}
                        </a>
                    ) : (
                        '-'
                    )}
                </div>
            );
        },
    }),
    makeColumn<TenantContractItem>({
        id: 'start_date',
        accessorKey: 'start_date',
        title: 'Mulai',
        sortable: true,
        className: COL.start,
        cell: ({ getValue }) => (
            <div className={COL.start}>{(getValue() as string) ?? '-'}</div>
        ),
    }),
    makeColumn<TenantContractItem>({
        id: 'end_date',
        accessorKey: 'end_date',
        title: 'Berakhir',
        sortable: true,
        className: COL.end,
        cell: ({ getValue }) => (
            <div className={COL.end}>{(getValue() as string) ?? '-'}</div>
        ),
    }),
    makeColumn<TenantContractItem>({
        id: 'rent',
        title: 'Sewa',
        className: COL.rent,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.rent}>{formatIDR(row.original.rent_cents)}</div>
        ),
    }),
    makeColumn<TenantContractItem>({
        id: 'status',
        accessorKey: 'status',
        title: 'Status',
        className: COL.status,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.status}>
                <Badge variant={variantForContractStatus(row.original.status)}>
                    {row.original.status}
                </Badge>
            </div>
        ),
    }),
    makeColumn<TenantContractItem>({
        id: 'days_left',
        title: 'Sisa Hari',
        className: COL.daysLeft,
        cell: ({ row }) => {
            const s = String(row.original.status || '');
            const end = row.original.end_date
                ? new Date(row.original.end_date)
                : null;
            if (s.toLowerCase() !== 'active' || !end)
                return <div className={COL.daysLeft}>-</div>;
            const today = new Date();
            const d0 = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
            );
            const d1 = new Date(
                end.getFullYear(),
                end.getMonth(),
                end.getDate(),
            );
            const diffMs = d1.getTime() - d0.getTime();
            const days = Math.max(0, Math.ceil(diffMs / 86_400_000));
            if (days <= 0) {
                return (
                    <div className={COL.daysLeft}>
                        <Badge variant="destructive">Habis</Badge>
                    </div>
                );
            }
            if (days <= 7) {
                return (
                    <div className={COL.daysLeft}>
                        <Badge className="border-amber-200 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            {`${days} hari`}
                        </Badge>
                    </div>
                );
            }
            return (
                <div className={COL.daysLeft}>
                    <Badge variant="secondary">{`${days} hari`}</Badge>
                </div>
            );
        },
    }),
    makeColumn<TenantContractItem>({
        id: 'renew',
        title: 'Auto‑Renew',
        className: COL.renew,
        cell: ({ row }) => (
            <div className={COL.renew}>
                {row.original.auto_renew ? 'Ya' : 'Tidak'}
            </div>
        ),
    }),
    makeColumn<TenantContractItem>({
        id: 'actions',
        title: 'Aksi',
        className: COL.actions + ' flex justify-end items-center',
        cell: ({ row }) => {
            const r = row.original as TenantContractItem;
            const isActive = String(r.status || '').toLowerCase() === 'active';
            return (
                <div className={COL.actions + ' flex items-center justify-end'}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Aksi kontrak ${r.id}`}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() =>
                                    (window.location.href = route(
                                        'tenant.contracts.show',
                                        { contract: r.id },
                                    ))
                                }
                            >
                                <Eye className="mr-2 h-4 w-4" /> Lihat detail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    const url = route('tenant.invoices.index');
                                    const qs = `?q=${encodeURIComponent(`contract:${r.id}`)}`;
                                    window.location.href = url + qs;
                                }}
                            >
                                <ReceiptText className="mr-2 h-4 w-4" /> Lihat
                                invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                disabled={!r.auto_renew || !isActive}
                                onClick={() => opts?.onStopAutoRenew?.(r)}
                            >
                                <RefreshCcw className="mr-2 h-4 w-4" /> Hentikan
                                perpanjangan otomatis
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    }),
];

export const columns: ColumnDef<TenantContractItem>[] = createColumns();
