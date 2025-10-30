'use client';

import { Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Eye,
    MoreHorizontal,
    Printer,
    ReceiptText,
    RefreshCcw,
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
import i18n from '@/lib/i18n';
import { variantForContractStatus } from '@/lib/status';
import type {
    TenantContractColumnOptions as ColumnFactoryOptions,
    TenantContractItem,
} from '@/types/tenant';

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

export const createColumns = (
    opts?: ColumnFactoryOptions,
): ColumnDef<TenantContractItem>[] => [
    makeColumn<TenantContractItem>({
        id: 'number',
        title: i18n.t('common.number'),
        className: 'shrink-0 w-[180px] font-mono',
        cell: ({ row }) => {
            const href = route('tenant.contracts.show', {
                contract: row.original.id,
            });
            const no = row.original.number || '-';
            return (
                <div className="w-[180px] shrink-0 font-mono">
                    {row.original.number ? (
                        <Link
                            href={href}
                            className="underline underline-offset-2 hover:opacity-80"
                        >
                            {no}
                        </Link>
                    ) : (
                        no
                    )}
                </div>
            );
        },
    }),
    makeColumn<TenantContractItem>({
        id: 'room',
        title: i18n.t('common.room'),
        className: COL.room,
        cell: ({ row }) => (
            <div className={COL.room}>{row.original.room?.number ?? '-'}</div>
        ),
    }),
    makeColumn<TenantContractItem>({
        id: 'start_date',
        accessorKey: 'start_date',
        title: i18n.t('common.start'),
        sortable: true,
        className: COL.start,
        cell: ({ getValue }) => (
            <div className={COL.start}>{(getValue() as string) ?? '-'}</div>
        ),
    }),
    makeColumn<TenantContractItem>({
        id: 'end_date',
        accessorKey: 'end_date',
        title: i18n.t('common.end'),
        sortable: true,
        className: COL.end,
        cell: ({ getValue }) => (
            <div className={COL.end}>{(getValue() as string) ?? '-'}</div>
        ),
    }),
    makeColumn<TenantContractItem>({
        id: 'rent',
        title: i18n.t('common.rent'),
        className: COL.rent,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.rent}>{formatIDR(row.original.rent_idr)}</div>
        ),
    }),
    makeColumn<TenantContractItem>({
        id: 'status',
        accessorKey: 'status',
        title: i18n.t('common.status'),
        className: COL.status,
        sortable: true,
        cell: ({ row }) => {
            const raw = row.original.status || '';
            const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
            const label = i18n.t(`contract.status.${key}`, {
                ns: 'enum',
                defaultValue: raw,
            });
            return (
                <div className={COL.status}>
                    <Badge variant={variantForContractStatus(raw)}>
                        {label}
                    </Badge>
                </div>
            );
        },
    }),
    makeColumn<TenantContractItem>({
        id: 'days_left',
        title: i18n.t('common.days_left'),
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
                        <Badge variant="destructive">
                            {i18n.t('common.expired')}
                        </Badge>
                    </div>
                );
            }
            if (days <= 7) {
                return (
                    <div className={COL.daysLeft}>
                        <Badge className="border-amber-200 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            {i18n.t('common.days', { count: days })}
                        </Badge>
                    </div>
                );
            }
            return (
                <div className={COL.daysLeft}>
                    <Badge variant="secondary">
                        {i18n.t('common.days', { count: days })}
                    </Badge>
                </div>
            );
        },
    }),
    makeColumn<TenantContractItem>({
        id: 'renew',
        title: i18n.t('common.auto_renew'),
        className: COL.renew,
        cell: ({ row }) => (
            <div className={COL.renew}>
                {row.original.auto_renew
                    ? i18n.t('common.yes')
                    : i18n.t('common.no')}
            </div>
        ),
    }),
    makeColumn<TenantContractItem>({
        id: 'actions',
        title: i18n.t('common.actions'),
        className: COL.actions + ' flex justify-end items-center',
        cell: ({ row }) => {
            const r = row.original as TenantContractItem;
            const isActive =
                String(r.status || '')
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, '_') === 'active';
            return (
                <div className={COL.actions + ' flex items-center justify-end'}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={i18n.t('contract.actions_for', {
                                    id: r.id,
                                })}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                {i18n.t('common.actions')}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() =>
                                    router.visit(
                                        route('tenant.contracts.show', {
                                            contract: r.id,
                                        }),
                                    )
                                }
                            >
                                <Eye className="mr-2 h-4 w-4" />{' '}
                                {i18n.t('common.view_detail')}
                            </DropdownMenuItem>
                            {r.needs_ack_checkin ? (
                                <DropdownMenuItem
                                    onClick={() => opts?.onViewCheckin?.(r)}
                                >
                                    <Eye className="mr-2 h-4 w-4" />{' '}
                                    {i18n.t('contract.view_checkin')}
                                </DropdownMenuItem>
                            ) : null}
                            {r.needs_ack_checkout ? (
                                <DropdownMenuItem
                                    onClick={() => opts?.onViewCheckout?.(r)}
                                >
                                    <Eye className="mr-2 h-4 w-4" />{' '}
                                    {i18n.t('contract.view_checkout')}
                                </DropdownMenuItem>
                            ) : null}
                            <Can all={['tenant.invoice.view']}>
                                <DropdownMenuItem
                                    onClick={() => {
                                        const url = route(
                                            'tenant.invoices.index',
                                        );
                                        const qs = `?q=${encodeURIComponent(`contract:${r.id}`)}`;
                                        router.visit(url + qs);
                                    }}
                                >
                                    <ReceiptText className="mr-2 h-4 w-4" />{' '}
                                    {i18n.t('contract.actions.view_invoices')}
                                </DropdownMenuItem>
                            </Can>
                            <DropdownMenuItem
                                onClick={() =>
                                    window.open(
                                        route('tenant.contracts.print', {
                                            contract: r.id,
                                        }),
                                        '_blank',
                                    )
                                }
                            >
                                <Printer className="mr-2 h-4 w-4" />{' '}
                                {i18n.t('contract.actions.print')}
                            </DropdownMenuItem>
                            <Can all={['tenant.contract.stop-auto-renew']}>
                                <DropdownMenuItem
                                    disabled={!r.auto_renew || !isActive}
                                    onClick={() => opts?.onStopAutoRenew?.(r)}
                                >
                                    <RefreshCcw className="mr-2 h-4 w-4" />{' '}
                                    {i18n.t('contract.autorenew.stop_action')}
                                </DropdownMenuItem>
                            </Can>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    }),
];

export const columns: ColumnDef<TenantContractItem>[] = createColumns();
