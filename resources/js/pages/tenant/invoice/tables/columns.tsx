'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { CreditCard, Eye, MoreHorizontal, Printer } from 'lucide-react';

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
        title: i18n.t('common.number'),
        className: COL.number,
        sortable: true,
        cell: ({ row }) => (
            <div className={`flex items-center gap-2 ${COL.number}`}>
                <button
                    type="button"
                    className="text-left font-mono text-xs hover:underline"
                    onClick={() => opts?.onShowDetail?.(row.original)}
                    aria-label={`${i18n.t('common.view_detail')} ${row.original.number}`}
                >
                    {row.original.number}
                </button>
            </div>
        ),
    }),
    makeColumn<TenantInvoiceItem>({
        id: 'due_date',
        title: i18n.t('common.due_date'),
        className: COL.due,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.due}>{row.original.due_date}</div>
        ),
    }),
    makeColumn<TenantInvoiceItem>({
        id: 'status',
        title: i18n.t('common.status'),
        className: COL.status,
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
    makeColumn<TenantInvoiceItem>({
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
    makeColumn<TenantInvoiceItem>({
        id: 'outstanding_idr',
        title: i18n.t('tenant/invoice:outstanding'),
        className: COL.outstanding,
        sortable: true,
        cell: ({ row }) => (
            <div className={COL.outstanding}>
                {formatIDR(row.original.outstanding_idr)}
            </div>
        ),
    }),
    makeColumn<TenantInvoiceItem>({
        id: 'actions',
        title: i18n.t('common.actions'),
        className: COL.actions + ' flex justify-end items-center',
        cell: ({ row }) => {
            const inv = row.original;
            const canPay =
                (inv.outstanding_idr ?? 0) > 0 &&
                (inv.status || '').trim().toLowerCase().replace(/\s+/g, '_') !==
                    'cancelled';
            return (
                <div className={`${COL.actions} flex items-center justify-end`}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`${i18n.t('tenant/invoice:actions_for', { number: inv.number })}`}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>
                                {i18n.t('common.actions')}
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => opts?.onShowDetail?.(inv)}
                            >
                                <Eye className="mr-2 h-4 w-4" />{' '}
                                {i18n.t('common.view_detail')}
                            </DropdownMenuItem>
                            <Can all={['invoice.view']}>
                                <DropdownMenuItem
                                    onClick={() =>
                                        window.open(
                                            route(
                                                'tenant.invoices.print',
                                                inv.id,
                                            ),
                                            '_blank',
                                        )
                                    }
                                >
                                    <Printer className="mr-2 h-4 w-4" />{' '}
                                    {i18n.t('common.print')}
                                </DropdownMenuItem>
                            </Can>
                            {canPay ? (
                                <>
                                    <DropdownMenuSeparator />
                                    <Can all={['payment.create']}>
                                        <DropdownMenuItem
                                            onClick={() => opts?.onPay?.(inv)}
                                        >
                                            <CreditCard className="mr-2 h-4 w-4" />{' '}
                                            {i18n.t('common.pay')}
                                        </DropdownMenuItem>
                                    </Can>
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
