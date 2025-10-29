'use client';

import { Link } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Clock3,
    Eye,
    MoreHorizontal,
    Printer,
    Receipt,
    XCircle,
} from 'lucide-react';

import { Can } from '@/components/acl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyInline } from '@/components/ui/copy-inline';
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
import { variantForInvoiceStatus } from '@/lib/status';
import type { BaseInvoiceRow, CreateColumnsOpts } from '@/types/management';

const COL = {
    number: 'shrink-0 w-[176px] md:w-[208px] lg:w-[224px]',
    tenant: 'shrink-0 w-[176px] md:w-[208px] lg:w-[240px]',
    room: 'shrink-0 w-[60px] md:w-[76px] lg:w-[102px]',
    due: 'shrink-0 w-[100px] md:w-[116px]',
    status: 'shrink-0 w-[52px] md:w-[78px]',
    amount: 'shrink-0 w-[66px] md:w-[88px]',
    outstanding: 'shrink-0 w-[66px] md:w-[88px]',
    actions: 'shrink-0 w-10 md:w-[48px] text-right',
} as const;

export const createColumns = <T extends BaseInvoiceRow>(
    opts?: CreateColumnsOpts<T>,
): ColumnDef<T>[] => [
    makeColumn<T>({
        id: 'number',
        title: i18n.t('common.number'),
        className: COL.number,
        sortable: true,
        cell: ({ row }) => {
            const inv = row.original;
            const t = i18n.t.bind(i18n);
            return (
                <div className={`flex items-center gap-2 ${COL.number}`}>
                    <button
                        type="button"
                        className="text-left font-mono text-xs underline underline-offset-2"
                        onClick={() => opts?.onShowDetail?.(inv)}
                        aria-label={t('common.view_detail') + ' ' + inv.number}
                        title={t('common.view_detail')}
                    >
                        {inv.number}
                    </button>
                    <CopyInline
                        value={inv.number}
                        variant="icon"
                        size="sm"
                        title={t('invoice.copy_number')}
                        aria-label={t('invoice.copy_number')}
                    />
                </div>
            );
        },
    }),
    makeColumn<T>({
        id: 'tenant',
        title: i18n.t('common.tenant'),
        className: COL.tenant,
        cell: ({ row }) => {
            const name = row.original.tenant ?? '—';
            const email = (row.original as { tenant_email?: string | null })
                .tenant_email;
            return (
                <div className={COL.tenant + ' flex flex-col'}>
                    <span className="truncate font-medium">{name}</span>
                    {email ? (
                        <span className="text-muted-foreground truncate text-xs">
                            {email}
                        </span>
                    ) : null}
                </div>
            );
        },
    }),
    makeColumn<T>({
        id: 'room',
        title: i18n.t('common.room'),
        className: COL.room,
        cell: ({ row }) => (
            <div className={`${COL.room} truncate`}>
                {row.original.room_number ?? '—'}
            </div>
        ),
    }),
    makeColumn<T>({
        id: 'due_date',
        title: i18n.t('common.due_date'),
        className: COL.due,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.due}>{row.original.due_date}</div>
        ),
    }),
    makeColumn<T>({
        id: 'status',
        title: i18n.t('common.status'),
        className: COL.status,
        sortable: true,
        cell: ({ row }) => {
            const raw = row.original.status || '';
            const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
            const label = i18n.t(`invoice.status.${key}`, {
                ns: 'enum',
                defaultValue: raw,
            });
            return (
                <div className={COL.status}>
                    <Badge variant={variantForInvoiceStatus(raw)}>
                        {label}
                    </Badge>
                </div>
            );
        },
    }),
    makeColumn<T>({
        id: 'amount_idr',
        title: i18n.t('common.amount'),
        className: COL.amount,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.amount}>
                {formatIDR(row.original.amount_idr)}
            </div>
        ),
    }),
    makeColumn<T>({
        id: 'outstanding',
        title: i18n.t('table.columns.outstanding', {
            ns: 'management/invoice',
        }),
        className: COL.outstanding,
        cell: ({ row }) => (
            <div className={COL.outstanding}>
                {formatIDR(row.original.outstanding ?? 0)}
            </div>
        ),
    }),
    makeColumn<T>({
        id: 'actions',
        title: i18n.t('common.actions'),
        className: `${COL.actions} pr-2 md:pr-3 flex justify-end items-center`,
        cell: ({ row }) => {
            const inv = row.original;
            const t = i18n.t.bind(i18n);
            return (
                <div
                    className={`${COL.actions} flex items-center justify-end pr-2 md:pr-3`}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t('table.actions_for', {
                                    ns: 'management/invoice',
                                    number: inv.number,
                                })}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                {t('common.actions')}
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => opts?.onShowDetail?.(inv)}
                            >
                                <Eye className="mr-2 h-4 w-4" />{' '}
                                {t('common.view_detail')}
                            </DropdownMenuItem>
                            {typeof inv.ticket_url === 'string' &&
                            inv.ticket_url ? (
                                <DropdownMenuItem asChild>
                                    <Link href={inv.ticket_url} target="_blank">
                                        <Receipt className="mr-2 h-4 w-4" />
                                        {t('table.view_ticket', {
                                            ns: 'management/invoice',
                                        })}
                                    </Link>
                                </DropdownMenuItem>
                            ) : null}
                            {(() => {
                                const k = (inv.status || '')
                                    .trim()
                                    .toLowerCase()
                                    .replace(/\s+/g, '_');
                                return k === 'overdue' || k === 'pending';
                            })() ? (
                                <Can all={['invoice.update']}>
                                    <DropdownMenuItem
                                        onClick={() => opts?.onExtendDue?.(inv)}
                                    >
                                        <Clock3 className="mr-2 h-4 w-4" />{' '}
                                        {t('extend_due.action', {
                                            ns: 'management/invoice',
                                        })}
                                    </DropdownMenuItem>
                                </Can>
                            ) : null}
                            <DropdownMenuItem
                                onClick={() => opts?.onPrint?.(inv)}
                            >
                                <Printer className="mr-2 h-4 w-4" />{' '}
                                {t('common.print')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {inv.status !== 'Voided' ? (
                                <Can all={['invoice.update']}>
                                    <DropdownMenuItem
                                        onClick={() => opts?.onCancel?.(inv)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />{' '}
                                        {t('common.cancel')}
                                    </DropdownMenuItem>
                                </Can>
                            ) : null}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    }),
];
