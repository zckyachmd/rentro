'use client';

import { Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Eye,
    LogIn,
    LogOut,
    MoreHorizontal,
    Printer,
    ReceiptText,
    RefreshCcw,
    RefreshCw,
    Trash2,
} from 'lucide-react';

import { Can } from '@/components/acl';
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
import type {
    ContractColumnOptions as ColumnFactoryOptions,
    ContractItem,
} from '@/types/management';

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

// ContractItem moved to pages/types

const COL = {
    tenant: 'shrink-0 min-w-[200px] md:w-[260px]',
    room: 'shrink-0 w-[110px]',
    start: 'shrink-0 w-[120px]',
    end: 'shrink-0 w-[120px]',
    rent: 'shrink-0 w-[140px] text-right',
    status: 'shrink-0 w-[120px]',
    daysLeft: 'shrink-0 w-[120px] text-right',
    renew: 'shrink-0 w-[120px]',
    actions: 'shrink-0 w-10 md:w-[48px] text-right',
};

export const createColumns = (
    opts?: ColumnFactoryOptions & {
        requireCheckinForActivate?: boolean;
    },
): ColumnDef<ContractItem>[] => [
    makeColumn<ContractItem>({
        id: 'number',
        title: 'Nomor',
        className: 'shrink-0 w-[200px] font-mono',
        cell: ({ row }) => {
            const no = row.original.number || '';
            const href = route('management.contracts.show', {
                contract: row.original.id,
            });
            return (
                <div className="w-[200px] shrink-0 font-mono">
                    {no ? (
                        <Link
                            href={href}
                            className="underline underline-offset-2 hover:opacity-80"
                            title={`Lihat kontrak ${no}`}
                        >
                            {no}
                        </Link>
                    ) : (
                        '-'
                    )}
                </div>
            );
        },
    }),
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
            const canStartRenew = RENEW_ALLOWED.includes(s);
            const canStopRenew = s === CS.ACTIVE;
            const lastCheckinStatus = row.original.latest_checkin_status;
            const requireCheckin = Boolean(opts?.requireCheckinForActivate);
            const hasPendingCheckin =
                (lastCheckinStatus ?? '').toLowerCase() === 'pending';
            const canCheckin =
                !hasPendingCheckin &&
                !row.original.has_checkin &&
                (s === CS.BOOKED || (!requireCheckin && s === CS.ACTIVE));

            const lastCheckin = String(lastCheckinStatus || '').toLowerCase();
            const lastCheckout = String(
                row.original.latest_checkout_status || '',
            ).toLowerCase();
            const hasConfirmedCheckin = Boolean(row.original.has_checkin);
            const canCheckout =
                (s === CS.ACTIVE ||
                    (s === CS.COMPLETED && lastCheckout === 'disputed')) &&
                (hasConfirmedCheckin || lastCheckin === 'confirmed') &&
                lastCheckout !== 'pending' &&
                lastCheckout !== 'confirmed';

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
                                    router.visit(
                                        route('management.contracts.show', {
                                            contract: row.original.id,
                                        }),
                                    )
                                }
                            >
                                <Eye className="mr-2 h-4 w-4" /> Lihat detail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    window.open(
                                        route('management.contracts.print', {
                                            contract: row.original.id,
                                        }),
                                        '_blank',
                                    )
                                }
                            >
                                <Printer className="mr-2 h-4 w-4" /> Cetak
                                kontrak
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => {
                                    const url = route(
                                        'management.invoices.index',
                                    );
                                    const qs = `?search=${encodeURIComponent(`contract:${row.original.id}`)}`;
                                    router.visit(url + qs);
                                }}
                            >
                                <ReceiptText className="mr-2 h-4 w-4" /> Lihat
                                invoice
                            </DropdownMenuItem>

                            {canCheckin && (
                                <Can any={['handover.create']}>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            opts?.onCheckin?.(row.original)
                                        }
                                    >
                                        <LogIn className="mr-2 h-4 w-4" />{' '}
                                        Check‑in
                                    </DropdownMenuItem>
                                </Can>
                            )}
                            {canCheckout && (
                                <Can any={['handover.create']}>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            opts?.onCheckout?.(row.original)
                                        }
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />{' '}
                                        Check‑out
                                    </DropdownMenuItem>
                                </Can>
                            )}

                            {row.original.auto_renew && canStopRenew && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        opts?.onStopAutoRenew?.(row.original)
                                    }
                                >
                                    <RefreshCcw className="mr-2 h-4 w-4" />{' '}
                                    Hentikan perpanjangan otomatis
                                </DropdownMenuItem>
                            )}
                            {!row.original.auto_renew && canStartRenew && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        opts?.onStartAutoRenew?.(row.original)
                                    }
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />{' '}
                                    Nyalakan perpanjangan otomatis
                                </DropdownMenuItem>
                            )}

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
