'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
    Eye,
    MoreHorizontal,
    ReceiptText,
    RefreshCcw,
    RefreshCw,
    Trash2,
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
import { formatIDR } from '@/lib/format';
import { variantForContractStatus } from '@/lib/status';

const CS = {
    PENDING_PAYMENT: 'Pending Payment',
    BOOKED: 'Booked',
    PAID: 'Paid',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    OVERDUE: 'Overdue',
    CANCELLED: 'Cancelled',
} as const;

const CANCELABLE: ReadonlyArray<string> = [CS.PENDING_PAYMENT, CS.BOOKED];
const RENEW_ALLOWED: ReadonlyArray<string> = [CS.BOOKED, CS.PAID, CS.ACTIVE];

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

export type ColumnFactoryOptions = {
    onCancel?: (c: ContractItem) => void;
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
                <Badge variant={variantForContractStatus(row.original.status)}>
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
        cell: ({ row }) => {
            const s = row.original.status;
            const canCancel = CANCELABLE.includes(s);
            const canToggleRenew = RENEW_ALLOWED.includes(s);

            return (
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
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={() =>
                                    (window.location.href = route(
                                        'management.contracts.show',
                                        { contract: row.original.id },
                                    ))
                                }
                            >
                                <Eye className="mr-2 h-4 w-4" /> Lihat detail
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => {
                                    const url = route(
                                        'management.invoices.index',
                                    );
                                    const qs = `?search=${encodeURIComponent(`contract:${row.original.id}`)}`;
                                    window.location.href = url + qs;
                                }}
                            >
                                <ReceiptText className="mr-2 h-4 w-4" /> Lihat
                                invoice
                            </DropdownMenuItem>

                            {canToggleRenew &&
                                (row.original.auto_renew ? (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            opts?.onStopAutoRenew?.(
                                                row.original,
                                            )
                                        }
                                    >
                                        <RefreshCcw className="mr-2 h-4 w-4" />{' '}
                                        Hentikan perpanjangan otomatis
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            opts?.onStartAutoRenew?.(
                                                row.original,
                                            )
                                        }
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />{' '}
                                        Nyalakan perpanjangan otomatis
                                    </DropdownMenuItem>
                                ))}

                            {canCancel && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() =>
                                            opts?.onCancel?.(row.original)
                                        }
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />{' '}
                                        Batalkan kontrak
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    }),
];

export const columns: ColumnDef<ContractItem>[] = createColumns();
