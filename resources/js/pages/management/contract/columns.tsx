'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

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

export interface ContractItem {
    id: string;
    tenant?: { id: number; name: string; email: string } | null;
    room?: { id: string; number: string } | null;
    start_date?: string | null;
    end_date?: string | null;
    rent_cents: number;
    status: string;
    auto_renew: boolean;
}

const COL = {
    tenant: 'shrink-0 min-w-[200px] md:w-[260px]',
    room: 'shrink-0 w-[110px]',
    start: 'shrink-0 w-[120px]',
    end: 'shrink-0 w-[120px]',
    rent: 'shrink-0 w-[140px] text-right',
    status: 'shrink-0 w-[120px]',
    renew: 'shrink-0 w-[120px]',
    actions: 'shrink-0 w-10 md:w-[48px] text-right',
};

const statusColor: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    Draft: 'outline',
    Active: 'default',
    Completed: 'secondary',
    Cancelled: 'destructive',
};

const formatIDR = (cents?: number | null) => {
    if (!cents) return '-';
    const idr = Math.round((cents as number) / 100);
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(idr);
};

export type ColumnFactoryOptions = {
    onCancel?: (c: ContractItem) => void;
    onExtendDue?: (c: ContractItem) => void;
    onStopAutoRenew?: (c: ContractItem) => void;
    onStartAutoRenew?: (c: ContractItem) => void;
};

export const createColumns = (
    opts?: ColumnFactoryOptions,
): ColumnDef<ContractItem>[] => [
    makeColumn<ContractItem>({
        id: 'tenant',
        title: 'Penyewa',
        className: COL.tenant,
        cell: ({ row }) => (
            <div className={COL.tenant + ' flex flex-col'}>
                <span className="font-medium">
                    {row.original.tenant?.name ?? '-'}
                </span>
                {row.original.tenant?.email && (
                    <span className="text-xs text-muted-foreground">
                        {row.original.tenant?.email}
                    </span>
                )}
            </div>
        ),
    }),
    makeColumn<ContractItem>({
        id: 'room',
        title: 'Kamar',
        className: COL.room,
        cell: ({ row }) => (
            <div className={COL.room}>{row.original.room?.number ?? '-'}</div>
        ),
    }),
    makeColumn<ContractItem>({
        id: 'start_date',
        accessorKey: 'start_date',
        title: 'Mulai',
        sortable: true,
        className: COL.start,
        cell: ({ getValue }) => (
            <div className={COL.start}>{(getValue() as string) ?? '-'}</div>
        ),
    }),
    makeColumn<ContractItem>({
        id: 'end_date',
        accessorKey: 'end_date',
        title: 'Berakhir',
        sortable: true,
        className: COL.end,
        cell: ({ getValue }) => (
            <div className={COL.end}>{(getValue() as string) ?? '-'}</div>
        ),
    }),
    makeColumn<ContractItem>({
        id: 'rent',
        title: 'Sewa',
        className: COL.rent,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.rent}>{formatIDR(row.original.rent_cents)}</div>
        ),
    }),
    makeColumn<ContractItem>({
        id: 'status',
        accessorKey: 'status',
        title: 'Status',
        className: COL.status,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.status}>
                <Badge variant={statusColor[row.original.status] ?? 'outline'}>
                    {row.original.status}
                </Badge>
            </div>
        ),
    }),
    makeColumn<ContractItem>({
        id: 'renew',
        title: 'Auto‑Renew',
        className: COL.renew,
        cell: ({ row }) => (
            <div className={COL.renew}>
                {row.original.auto_renew ? 'Ya' : 'Tidak'}
            </div>
        ),
    }),
    makeColumn<ContractItem>({
        id: 'actions',
        title: 'Aksi',
        className: COL.actions + ' flex justify-end items-center',
        cell: ({ row }) => (
            <div className={COL.actions + ' flex items-center justify-end'}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Aksi kontrak ${row.original.id}`}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {/* Batalkan kontrak (Pending/Booked) */}
                        {['Pending Payment', 'Booked'].includes(row.original.status) && (
                            <DropdownMenuItem onClick={() => opts?.onCancel?.(row.original)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Batalkan
                            </DropdownMenuItem>
                        )}
                        {/* Perpanjang tenggat (Overdue atau Pending) */}
                        {['Overdue', 'Pending Payment'].includes(row.original.status) && (
                            <DropdownMenuItem onClick={() => opts?.onExtendDue?.(row.original)}>
                                <Pencil className="mr-2 h-4 w-4" /> Perpanjang tenggat
                            </DropdownMenuItem>
                        )}
                        {/* Toggle auto-renew (hanya jika belum selesai/dibatalkan) */}
                        {!['Completed', 'Cancelled'].includes(row.original.status) && (
                            row.original.auto_renew ? (
                                <DropdownMenuItem onClick={() => opts?.onStopAutoRenew?.(row.original)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Hentikan Auto‑renew
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => opts?.onStartAutoRenew?.(row.original)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Nyalakan Auto‑renew
                                </DropdownMenuItem>
                            )
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        ),
    }),
];

export const columns: ColumnDef<ContractItem>[] = createColumns();
