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
import i18n from '@/lib/i18n';
import { variantForContractStatus } from '@/lib/status';
import type {
    ContractColumnOptions as ColumnFactoryOptions,
    ContractItem,
} from '@/types/management';

const norm = (s: string) => (s || '').trim().toLowerCase().replace(/\s+/g, '_');
const CS = {
    PENDING_PAYMENT: 'pending_payment',
    BOOKED: 'booked',
    PAID: 'paid',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled',
} as const;

const CANCELABLE: ReadonlyArray<string> = [CS.PENDING_PAYMENT, CS.BOOKED];
const RENEW_ALLOWED: ReadonlyArray<string> = [CS.BOOKED, CS.PAID, CS.ACTIVE];

const COL = {
    tenant: 'shrink-0 w-[176px] md:w-[208px] lg:w-[240px]',
    room: 'shrink-0 w-[80px] md:w-[96px] lg:w-[112px]',
    start: 'shrink-0 w-[120px] md:w-[140px]',
    end: 'shrink-0 w-[120px] md:w-[140px]',
    rent: 'shrink-0 w-[130px] md:w-[160px]',
    status: 'shrink-0 w-[110px] md:w-[130px]',
    daysLeft: 'shrink-0 w-[110px] md:w-[130px]',
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
        title: i18n.t('common.number'),
        className: 'shrink-0 w-[176px] md:w-[208px] lg:w-[224px] font-mono',
        cell: ({ row }) => {
            const no = row.original.number || '';
            const href = route('management.contracts.show', {
                contract: row.original.id,
            });
            return (
                <div className="w-[176px] shrink-0 font-mono md:w-[208px] lg:w-[224px]">
                    {no ? (
                        <Link
                            href={href}
                            className="underline underline-offset-2 hover:opacity-80"
                            title={i18n.t(
                                'management/contract:table.view_detail_title',
                                { number: no },
                            )}
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
        title: i18n.t('common.tenant'),
        className: COL.tenant,
        cell: ({ row }) => (
            <div className={COL.tenant + ' flex flex-col'}>
                <span className="font-medium">
                    {row.original.tenant?.name ?? '-'}
                </span>
                {row.original.tenant?.email && (
                    <span className="text-muted-foreground text-xs">
                        {row.original.tenant?.email}
                    </span>
                )}
            </div>
        ),
    }),
    makeColumn<ContractItem>({
        id: 'room',
        title: i18n.t('common.room'),
        className: COL.room,
        cell: ({ row }) => (
            <div className={COL.room}>{row.original.room?.number ?? '-'}</div>
        ),
    }),
    makeColumn<ContractItem>({
        id: 'start_date',
        accessorKey: 'start_date',
        title: i18n.t('common.start'),
        sortable: true,
        className: COL.start,
        cell: ({ getValue }) => (
            <div className={COL.start}>{(getValue() as string) ?? '-'}</div>
        ),
    }),
    makeColumn<ContractItem>({
        id: 'end_date',
        accessorKey: 'end_date',
        title: i18n.t('common.end'),
        sortable: true,
        className: COL.end,
        cell: ({ getValue }) => (
            <div className={COL.end}>{(getValue() as string) ?? '-'}</div>
        ),
    }),
    makeColumn<ContractItem>({
        id: 'rent',
        title: i18n.t('management/contract:table.columns.rent'),
        className: COL.rent,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.rent}>{formatIDR(row.original.rent_idr)}</div>
        ),
    }),
    makeColumn<ContractItem>({
        id: 'status',
        accessorKey: 'status',
        title: i18n.t('common.status'),
        className: COL.status,
        sortable: true,
        cell: ({ row }) => {
            const raw = row.original.status || '';
            const key = norm(raw);
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
    makeColumn<ContractItem>({
        id: 'days_left',
        title: i18n.t('management/contract:table.columns.days_left'),
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
                            {i18n.t('management/contract:table.expired')}
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
    makeColumn<ContractItem>({
        id: 'renew',
        title: i18n.t('management/contract:table.columns.autorenew'),
        className: COL.renew,
        cell: ({ row }) => (
            <div className={COL.renew}>
                {row.original.auto_renew
                    ? i18n.t('common.yes')
                    : i18n.t('common.no')}
            </div>
        ),
    }),
    makeColumn<ContractItem>({
        id: 'actions',
        title: i18n.t('common.actions'),
        className: COL.actions + ' flex justify-end items-center',
        cell: ({ row }) => {
            const sRaw = row.original.status || '';
            const s = norm(sRaw);
            const canCancel = CANCELABLE.includes(s);
            const canStartRenew = RENEW_ALLOWED.includes(s);
            const canStopRenew = s === CS.ACTIVE;
            const lastCheckinStatus = row.original.latest_checkin_status;
            const requireCheckin = Boolean(opts?.requireCheckinForActivate);
            const hasPendingCheckin =
                (lastCheckinStatus ?? '').toLowerCase() === 'pending';
            const lastCheckin = String(lastCheckinStatus || '').toLowerCase();
            const canNormalCheckin =
                !hasPendingCheckin &&
                !row.original.has_checkin &&
                (s === CS.BOOKED || (!requireCheckin && s === CS.ACTIVE));
            const canRedoCheckin =
                !hasPendingCheckin &&
                lastCheckin === 'disputed' &&
                (s === CS.BOOKED || s === CS.ACTIVE);

            const canCheckin = canNormalCheckin || canRedoCheckin;

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
                                aria-label={i18n.t(
                                    'management/contract:table.actions_for',
                                    { id: row.original.id },
                                )}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>
                                {i18n.t('common.actions')}
                            </DropdownMenuLabel>
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
                                <Eye className="mr-2 h-4 w-4" />{' '}
                                {i18n.t('common.view_detail')}
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
                                <Printer className="mr-2 h-4 w-4" />{' '}
                                {i18n.t('contract.actions.print')}
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
                                <ReceiptText className="mr-2 h-4 w-4" />{' '}
                                {i18n.t('contract.actions.view_invoice')}
                            </DropdownMenuItem>

                            {canCheckin && (
                                <Can any={['handover.create']}>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            opts?.onCheckin?.(row.original)
                                        }
                                    >
                                        <LogIn className="mr-2 h-4 w-4" />{' '}
                                        {lastCheckin === 'disputed'
                                            ? i18n.t(
                                                  'management/contract:handover.menu.redo_checkin',
                                              )
                                            : i18n.t(
                                                  'management/contract:handover.menu.checkin',
                                              )}
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
                                        {i18n.t(
                                            'management/contract:handover.menu.checkout',
                                        )}
                                    </DropdownMenuItem>
                                </Can>
                            )}

                            {row.original.auto_renew && canStopRenew && (
                                <Can all={['contract.renew']}>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            opts?.onStopAutoRenew?.(
                                                row.original,
                                            )
                                        }
                                    >
                                        <RefreshCcw className="mr-2 h-4 w-4" />{' '}
                                        {i18n.t(
                                            'contract.autorenew.stop_action',
                                        )}
                                    </DropdownMenuItem>
                                </Can>
                            )}
                            {!row.original.auto_renew && canStartRenew && (
                                <Can all={['contract.renew']}>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            opts?.onStartAutoRenew?.(
                                                row.original,
                                            )
                                        }
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />{' '}
                                        {i18n.t(
                                            'contract.autorenew.start_action',
                                        )}
                                    </DropdownMenuItem>
                                </Can>
                            )}

                            {canCancel && (
                                <Can all={['contract.cancel']}>
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() =>
                                                opts?.onCancel?.(row.original)
                                            }
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />{' '}
                                            {i18n.t('common.cancel')}
                                        </DropdownMenuItem>
                                    </>
                                </Can>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    }),
];

export const columns: ColumnDef<ContractItem>[] = createColumns();
