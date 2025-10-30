import { FileWarning, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatDate, formatIDR } from '@/lib/format';
import { variantForInvoiceStatus } from '@/lib/status';
import type {
    PaymentRecent,
    TenantInvoiceListItem,
    TenantPayload,
} from '@/types/dashboard';

export default function TenantSummary({ tenant }: { tenant?: TenantPayload }) {
    const { t } = useTranslation();

    if (!tenant) return null;

    return (
        <div className="space-y-6">
            <div className="grid gap-3 sm:gap-4 md:grid-cols-3 lg:gap-5">
                {/* Contracts summary */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-muted-foreground text-sm font-medium">
                            {t('contract.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">
                                {tenant.contracts?.active ?? 0}
                            </div>
                            <Users className="text-muted-foreground h-6 w-6" />
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                            {t('dashboard.metrics.contracts_inactive', {
                                count: tenant.contracts?.inactive ?? 0,
                            })}
                        </p>
                        <div className="mt-1 text-right">
                            <Can all={['tenant.contract.view']}>
                                <a
                                    className="text-primary text-xs hover:underline"
                                    href={route('tenant.contracts.index')}
                                >
                                    {t('dashboard.actions.view_all')}
                                </a>
                            </Can>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-muted-foreground text-sm font-medium">
                            {t('dashboard.metrics.invoices_unpaid')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">
                                {(tenant.invoices?.pending ?? 0) +
                                    (tenant.invoices?.overdue ?? 0)}
                            </div>
                            <FileWarning className="text-muted-foreground h-6 w-6" />
                        </div>
                        <div className="mt-1 space-x-2 text-xs">
                            <Can all={['tenant.invoice.view']}>
                                <a
                                    className="text-primary hover:underline"
                                    href={`${route('tenant.invoices.index')}?status=pending`}
                                >
                                    {t('dashboard.actions.view_pending')}
                                </a>
                            </Can>
                            <span className="text-muted-foreground">•</span>
                            <Can all={['tenant.invoice.view']}>
                                <a
                                    className="text-primary hover:underline"
                                    href={`${route('tenant.invoices.index')}?status=overdue`}
                                >
                                    {t('dashboard.actions.view_overdue')}
                                </a>
                            </Can>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-muted-foreground text-sm font-medium">
                            {t('dashboard.metrics.outstanding_total')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold">
                            {formatIDR(tenant.invoices?.total_outstanding ?? 0)}
                        </div>
                        <div className="mt-1 text-right">
                            <Can all={['tenant.invoice.view']}>
                                <a
                                    className="text-primary text-xs hover:underline"
                                    href={route('tenant.invoices.index')}
                                >
                                    {t('dashboard.actions.view_all')}
                                </a>
                            </Can>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                        {t('dashboard.metrics.recent_invoices')}
                    </CardTitle>
                    <CardDescription>
                        {t('dashboard.metrics.recent_invoices_desc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {(
                        (tenant.invoices?.latest ??
                            []) as TenantInvoiceListItem[]
                    ).length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            {t('dashboard.metrics.no_recent_invoices')}
                        </p>
                    ) : (
                        <ul className="space-y-1 text-sm">
                            {(
                                (tenant.invoices?.latest ??
                                    []) as TenantInvoiceListItem[]
                            ).map((inv) => {
                                const statusKey = String(inv.status || '')
                                    .toLowerCase()
                                    .replace(/\s+/g, '_');
                                return (
                                    <li key={inv.id}>
                                        <a
                                            href={`${route('tenant.invoices.index')}?q=${encodeURIComponent(
                                                inv.number,
                                            )}`}
                                            className="hover:bg-accent flex items-center justify-between rounded px-2 py-2"
                                        >
                                            <div className="min-w-0">
                                                <div className="truncate font-medium">
                                                    {inv.number}
                                                </div>
                                                <div className="text-muted-foreground truncate">
                                                    {(inv.room_number || '-') +
                                                        ' • ' +
                                                        (inv.due_date
                                                            ? formatDate(
                                                                  inv.due_date,
                                                              )
                                                            : '-')}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="font-medium">
                                                        {formatIDR(
                                                            inv.amount_idr || 0,
                                                        )}
                                                    </div>
                                                    {(inv.outstanding_idr ??
                                                        0) > 0 && (
                                                        <div className="text-muted-foreground text-xs">
                                                            {formatIDR(
                                                                inv.outstanding_idr,
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <Badge
                                                    variant={variantForInvoiceStatus(
                                                        String(
                                                            inv.status || '',
                                                        ),
                                                    )}
                                                    className="capitalize"
                                                >
                                                    {t(
                                                        `invoice.status.${statusKey}`,
                                                        {
                                                            ns: 'enum',
                                                            defaultValue:
                                                                String(
                                                                    inv.status ||
                                                                        '-',
                                                                ),
                                                        },
                                                    )}
                                                </Badge>
                                            </div>
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                        {t('dashboard.metrics.recent_payments')}
                    </CardTitle>
                    <CardDescription>
                        {t('dashboard.metrics.recent_payments_desc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {((tenant.payments?.recent ?? []) as PaymentRecent[])
                        .length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            {t('dashboard.metrics.no_recent_payments')}
                        </p>
                    ) : (
                        <ul className="space-y-3 text-sm">
                            {(
                                (tenant.payments?.recent as
                                    | PaymentRecent[]
                                    | undefined) ?? []
                            ).map((p) => (
                                <li
                                    key={p.id}
                                    className="flex items-center justify-between"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate font-medium">
                                            {p.invoice_no || '-'}
                                        </div>
                                        <div className="text-muted-foreground truncate">
                                            {formatDate(p.paid_at)}
                                        </div>
                                    </div>
                                    <div className="text-right font-medium">
                                        {formatIDR(p.amount)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
