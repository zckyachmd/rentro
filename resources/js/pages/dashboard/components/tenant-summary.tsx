import { Banknote, FileWarning, Info, Users } from 'lucide-react';
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
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import {
    TooltipContent,
    TooltipTrigger,
    Tooltip as UiTooltip,
} from '@/components/ui/tooltip';
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
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                {t('contract.title')}
                            </CardTitle>
                            <UiTooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        aria-label={t('contract.title')}
                                        className="text-muted-foreground hover:text-foreground cursor-help"
                                    >
                                        <Info className="h-4 w-4" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span className="max-w-xs text-xs">
                                        {t('dashboard.hints.contracts_active')}
                                    </span>
                                </TooltipContent>
                            </UiTooltip>
                        </div>
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
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                {t('dashboard.metrics.invoices_unpaid')}
                            </CardTitle>
                            <UiTooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        aria-label={t(
                                            'dashboard.metrics.invoices_unpaid',
                                        )}
                                        className="text-muted-foreground hover:text-foreground cursor-help"
                                    >
                                        <Info className="h-4 w-4" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span className="max-w-xs text-xs">
                                        {t('dashboard.hints.invoices_unpaid')}
                                    </span>
                                </TooltipContent>
                            </UiTooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold">
                                {(tenant.invoices?.pending ?? 0) +
                                    (tenant.invoices?.overdue ?? 0)}
                            </div>
                            <FileWarning className="text-muted-foreground h-6 w-6" />
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                            {t('dashboard.metrics.invoices_overdue', {
                                count: tenant.invoices?.overdue ?? 0,
                            })}
                        </p>
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
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                {t('dashboard.metrics.outstanding_total')}
                            </CardTitle>
                            <UiTooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        aria-label={t(
                                            'dashboard.metrics.outstanding_total',
                                        )}
                                        className="text-muted-foreground hover:text-foreground cursor-help"
                                    >
                                        <Info className="h-4 w-4" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span className="max-w-xs text-xs">
                                        {t('dashboard.hints.outstanding_total')}
                                    </span>
                                </TooltipContent>
                            </UiTooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-semibold">
                                {formatIDR(
                                    tenant.invoices?.total_outstanding ?? 0,
                                )}
                            </div>
                            <Banknote className="text-muted-foreground h-6 w-6" />
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

            {/* Lists: Recent invoices & payments side-by-side for consistency */}
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:gap-5">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <CardTitle className="text-sm font-medium">
                                    {t('dashboard.metrics.recent_invoices')}
                                </CardTitle>
                                <CardDescription>
                                    {t(
                                        'dashboard.metrics.recent_invoices_desc',
                                    )}
                                </CardDescription>
                            </div>
                            <UiTooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        aria-label={t(
                                            'dashboard.metrics.recent_invoices',
                                        )}
                                        className="text-muted-foreground hover:text-foreground cursor-help"
                                    >
                                        <Info className="h-4 w-4" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span className="max-w-xs text-xs">
                                        {t(
                                            'dashboard.metrics.recent_invoices_desc',
                                        )}
                                    </span>
                                </TooltipContent>
                            </UiTooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {(
                            (tenant.invoices?.latest ??
                                []) as TenantInvoiceListItem[]
                        ).length === 0 ? (
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <FileWarning className="h-5 w-5" />
                                    </EmptyMedia>
                                    <EmptyTitle>
                                        {t(
                                            'dashboard.metrics.no_recent_invoices',
                                        )}
                                    </EmptyTitle>
                                    <EmptyDescription>
                                        <Can all={['tenant.invoice.view']}>
                                            <a
                                                href={route(
                                                    'tenant.invoices.index',
                                                )}
                                            >
                                                {t(
                                                    'dashboard.actions.view_all',
                                                )}
                                            </a>
                                        </Can>
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            <>
                                <ul className="space-y-1 text-sm">
                                    {(
                                        (tenant.invoices?.latest ??
                                            []) as TenantInvoiceListItem[]
                                    ).map((inv) => {
                                        const statusKey = String(
                                            inv.status || '',
                                        )
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
                                                            {(inv.room_number ||
                                                                '-') +
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
                                                                    inv.amount_idr ||
                                                                        0,
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
                                                                    inv.status ||
                                                                        '',
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
                                <div className="mt-3 text-right">
                                    <Can all={['tenant.invoice.view']}>
                                        <a
                                            className="text-primary text-xs hover:underline"
                                            href={route(
                                                'tenant.invoices.index',
                                            )}
                                        >
                                            {t('dashboard.actions.view_all')}
                                        </a>
                                    </Can>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <CardTitle className="text-sm font-medium">
                                    {t('dashboard.metrics.recent_payments')}
                                </CardTitle>
                                <CardDescription>
                                    {t(
                                        'dashboard.metrics.recent_payments_desc',
                                    )}
                                </CardDescription>
                            </div>
                            <UiTooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        aria-label={t(
                                            'dashboard.metrics.recent_payments',
                                        )}
                                        className="text-muted-foreground hover:text-foreground cursor-help"
                                    >
                                        <Info className="h-4 w-4" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span className="max-w-xs text-xs">
                                        {t(
                                            'dashboard.metrics.recent_payments_desc',
                                        )}
                                    </span>
                                </TooltipContent>
                            </UiTooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {((tenant.payments?.recent ?? []) as PaymentRecent[])
                            .length === 0 ? (
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <Banknote className="h-5 w-5" />
                                    </EmptyMedia>
                                    <EmptyTitle>
                                        {t(
                                            'dashboard.metrics.no_recent_payments',
                                        )}
                                    </EmptyTitle>
                                    <EmptyDescription>
                                        <Can all={['tenant.invoice.view']}>
                                            <a
                                                href={`${route('tenant.invoices.index')}?status=paid`}
                                            >
                                                {t(
                                                    'dashboard.actions.view_all',
                                                )}
                                            </a>
                                        </Can>
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            <>
                                <ul className="space-y-1 text-sm">
                                    {(
                                        (tenant.payments?.recent as
                                            | PaymentRecent[]
                                            | undefined) ?? []
                                    ).map((p) => (
                                        <li key={p.id}>
                                            <div className="hover:bg-accent flex items-center justify-between rounded px-2 py-2">
                                                <div className="min-w-0">
                                                    <div className="truncate font-medium">
                                                        {p.invoice_no || '-'}
                                                    </div>
                                                    <div className="text-muted-foreground truncate text-xs">
                                                        {formatDate(
                                                            p.paid_at,
                                                            true,
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right font-semibold">
                                                    {formatIDR(p.amount)}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-3 text-right">
                                    <Can all={['tenant.invoice.view']}>
                                        <a
                                            className="text-primary text-xs hover:underline"
                                            href={`${route('tenant.invoices.index')}?status=paid`}
                                        >
                                            {t('dashboard.actions.view_all')}
                                        </a>
                                    </Can>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
