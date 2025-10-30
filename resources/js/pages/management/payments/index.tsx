import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import { FilePlus2, Filter } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import AttachmentPreviewDialog from '@/components/attachment-preview';
import { DatePickerInput } from '@/components/date-picker';
import { QuickRange } from '@/components/quick-range';
import { Can } from '@/components/acl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QueryBag } from '@/components/ui/data-table-server';
import { DataTableServer } from '@/components/ui/data-table-server';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useServerTable } from '@/hooks/use-datatable';
import { AppLayout } from '@/layouts';
import { formatIDR } from '@/lib/format';
import PaymentDetailDialog from '@/pages/management/payments/dialogs/detail-dialog';
import ManualPaymentDialog from '@/pages/management/payments/dialogs/manual-dialog';
import VoidPaymentDialog from '@/pages/management/payments/dialogs/review-dialog';
import PaymentReviewDialog from '@/pages/management/payments/dialogs/void-dialog';
import { createColumns } from '@/pages/management/payments/tables/columns';
import type {
    PaymentIndexPageProps as PageProps,
    PaymentRow,
} from '@/types/management';

const currency = (amount: number): string => formatIDR(amount);

export default function PaymentIndex() {
    const { t } = useTranslation();
    const { t: tPayment } = useTranslation('management/payment');
    const { props } = usePage<InertiaPageProps & PageProps>();
    const paginator = props.payments;
    const rows: PaymentRow[] = React.useMemo(
        () => paginator?.data ?? [],
        [paginator?.data],
    );
    const methods = React.useMemo(
        () => props.options?.methods ?? [],
        [props.options?.methods],
    );
    const statuses = React.useMemo(
        () => props.options?.statuses ?? [],
        [props.options?.statuses],
    );

    const [processing, setProcessing] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    const [detail, setDetail] = React.useState<null | { id: string }>(null);
    const [preview, setPreview] = React.useState<null | {
        url: string;
        title?: string;
        description?: string;
        details?: { label: string; value: string }[];
    }>(null);
    const [review, setReview] = React.useState<null | { id: string }>(null);
    const [voiding, setVoiding] = React.useState<{
        target: PaymentRow | null;
        reason: string;
    }>({ target: null, reason: '' });

    const initialInvoiceNumber = React.useMemo(() => {
        const s = (props.query?.search || '').trim();
        return s && s.startsWith('INV-') ? s : '';
    }, [props.query?.search]);

    const currentPath = React.useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );

    const { q, onQueryChange, handleSortChange } = useServerTable({
        paginator: paginator ?? null,
        initial: props.query,
        currentPath,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    });
    const statusValue: string =
        (q as QueryBag & { status?: string | null }).status ?? 'all';
    const methodValue: string =
        (q as QueryBag & { method?: string | null }).method ?? 'all';
    const [start, setStart] = React.useState<string | null>(
        (props.query?.start as string | undefined) || null,
    );
    const [end, setEnd] = React.useState<string | null>(
        (props.query?.end as string | undefined) || null,
    );

    const applyDates = React.useCallback(() => {
        onQueryChange({ page: 1, start: start || null, end: end || null });
    }, [start, end, onQueryChange]);

    const invoiceCandidates = React.useMemo(
        () => props.invoiceCandidates ?? [],
        [props.invoiceCandidates],
    );
    const manualBanks = React.useMemo(
        () => props.paymentsExtra?.manual_banks ?? [],
        [props.paymentsExtra?.manual_banks],
    );

    return (
        <AppLayout
            pageTitle={tPayment('title')}
            pageDescription={tPayment('desc')}
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Filter className="h-4 w-4" />{' '}
                                {t('common.filter')}
                            </CardTitle>
                            {props.summary ? (
                                <div className="text-muted-foreground text-xs">
                                    <span className="mr-3">
                                        {t('common.total', 'Total')}:{' '}
                                        <span className="text-foreground font-medium">
                                            {props.summary.count}
                                        </span>
                                    </span>
                                    <span className="mr-3">
                                        {tPayment(
                                            'summary.completed',
                                            'Completed',
                                        )}
                                        :{' '}
                                        <span className="text-foreground font-medium">
                                            {formatIDR(
                                                props.summary.sum_completed,
                                            )}
                                        </span>
                                    </span>
                                    <span>
                                        {tPayment('summary.all', 'All')}:{' '}
                                        <span className="text-foreground font-medium">
                                            {formatIDR(props.summary.sum_all)}
                                        </span>
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-[180px_180px_1fr_1fr_auto] md:items-end">
                            <div>
                                <Label
                                    htmlFor="status"
                                    className="text-muted-foreground mb-1 block text-xs"
                                >
                                    {t('common.status')}
                                </Label>
                                <Select
                                    value={statusValue}
                                    onValueChange={(v) =>
                                        onQueryChange({
                                            page: 1,
                                            status: v === 'all' ? null : v,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full md:w-[180px]">
                                        <SelectValue
                                            placeholder={t(
                                                'common.all_statuses',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {t('common.all_statuses')}
                                        </SelectItem>
                                        {statuses.map((s) => {
                                            const slug = String(s)
                                                .trim()
                                                .toLowerCase()
                                                .replace(/\s+/g, '_');
                                            return (
                                                <SelectItem key={s} value={s}>
                                                    {t(
                                                        `payment.status.${slug}`,
                                                        {
                                                            ns: 'enum',
                                                            defaultValue:
                                                                String(s),
                                                        },
                                                    )}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-muted-foreground mb-1 block text-xs">
                                    {t('payment.form.method')}
                                </Label>
                                <Select
                                    value={methodValue}
                                    onValueChange={(v) =>
                                        onQueryChange({
                                            page: 1,
                                            method: v === 'all' ? null : v,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full md:w-[180px]">
                                        <SelectValue
                                            placeholder={t(
                                                'common.all_methods',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {t('common.all_methods')}
                                        </SelectItem>
                                        {methods.map((m) => (
                                            <SelectItem
                                                key={m.value}
                                                value={m.value}
                                            >
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-muted-foreground mb-1 block text-xs">
                                    {t('dashboard.filters.start')}
                                </Label>
                                <DatePickerInput
                                    value={start}
                                    onChange={setStart}
                                />
                            </div>
                            <div>
                                <Label className="text-muted-foreground mb-1 block text-xs">
                                    {t('dashboard.filters.end')}
                                </Label>
                                <DatePickerInput
                                    value={end}
                                    onChange={setEnd}
                                />
                            </div>
                            <div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={applyDates}
                                >
                                    {t('dashboard.filters.apply')}
                                </Button>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                                <QuickRange
                                    onSelect={(s, e) => {
                                        setStart(s);
                                        setEnd(e);
                                        onQueryChange({
                                            page: 1,
                                            start: s,
                                            end: e,
                                        });
                                    }}
                                    showReset
                                    resetDisabled={!start && !end}
                                    onReset={() => {
                                        setStart(null);
                                        setEnd(null);
                                        onQueryChange({
                                            page: 1,
                                            start: null,
                                            end: null,
                                        });
                                    }}
                                />
                            </div>
                            <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto md:flex-nowrap">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const qs = new URLSearchParams();
                                        if (
                                            statusValue &&
                                            statusValue !== 'all'
                                        )
                                            qs.set('status', statusValue);
                                        if (
                                            methodValue &&
                                            methodValue !== 'all'
                                        )
                                            qs.set('method', methodValue);
                                        if (start) qs.set('start', start);
                                        if (end) qs.set('end', end);
                                        const url = `${route('management.payments.export')}${qs.toString() ? `?${qs.toString()}` : ''}`;
                                        if (typeof window !== 'undefined')
                                            window.open(url, '_blank');
                                    }}
                                >
                                    {t('common.export_csv', 'Export CSV')}
                                </Button>
                                <Can all={["payment.create"]}>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setOpen(true)}
                                    >
                                        <FilePlus2 className="mr-2 h-4 w-4" />{' '}
                                        {tPayment('add')}
                                    </Button>
                                </Can>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <DataTableServer<PaymentRow, unknown>
                            columns={createColumns({
                                onPrint: (row) =>
                                    window.open(
                                        route(
                                            'management.payments.print',
                                            row.id,
                                        ),
                                        '_blank',
                                    ),
                                onVoid: (row) => {
                                    if (
                                        (row.status || '')
                                            .trim()
                                            .toLowerCase()
                                            .replace(/\s+/g, '_') ===
                                        'cancelled'
                                    )
                                        return;
                                    setVoiding({ target: row, reason: '' });
                                },
                                onShowDetail: (row) =>
                                    setDetail({ id: row.id }),
                                onReview: (row) => setReview({ id: row.id }),
                                currency,
                            })}
                            rows={rows}
                            paginator={paginator ?? null}
                            search={q.search}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, search: v })
                            }
                            searchKey="invoice"
                            searchPlaceholder={t('nav.search.placeholder')}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText={tPayment('empty')}
                            autoRefreshDefault="1m"
                            showRefresh={true}
                        />
                    </CardContent>
                </Card>
            </div>

            <ManualPaymentDialog
                open={open}
                onOpenChange={setOpen}
                methods={methods}
                initialInvoiceNumber={initialInvoiceNumber}
                invoiceCandidates={invoiceCandidates}
                manualBanks={manualBanks}
            />

            <PaymentDetailDialog
                target={detail}
                onClose={() => setDetail(null)}
            />
            <PaymentReviewDialog
                target={review}
                onClose={() => setReview(null)}
            />

            <AttachmentPreviewDialog
                open={!!preview}
                onOpenChange={(v: boolean) => {
                    if (!v) setPreview(null);
                }}
                url={preview?.url || ''}
                title={preview?.title}
                description={preview?.description}
                details={preview?.details || []}
            />

            <VoidPaymentDialog
                target={voiding.target}
                onOpenChange={(v: boolean) => {
                    if (!v) setVoiding({ target: null, reason: '' });
                }}
                processing={processing}
                onConfirm={(reason: string) => {
                    const p = voiding.target;
                    if (!p) return;
                    setProcessing(true);
                    router.post(
                        route('management.payments.void', p.id),
                        { reason },
                        {
                            onFinish: () => {
                                setProcessing(false);
                                setVoiding({ target: null, reason: '' });
                            },
                        },
                    );
                }}
            />
        </AppLayout>
    );
}
