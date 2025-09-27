import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import { FilePlus2, Filter } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { DatePickerInput } from '@/components/date-picker';
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
import CancelInvoiceDialog from '@/pages/management/invoice/dialogs/cancel-dialog';
import InvoiceDetailDialog from '@/pages/management/invoice/dialogs/detail-dialog';
import ExtendDueDialog from '@/pages/management/invoice/dialogs/extend-due-dialog';
import GenerateInvoiceDialog from '@/pages/management/invoice/dialogs/generate-dialog';
import { createColumns } from '@/pages/management/invoice/tables/columns';
import type {
    ManagementCancelState as CancelState,
    ManagementExtendState as ExtendState,
    InvoiceRow,
    ManagementInvoicePageProps as PageProps,
} from '@/types/management';

export default function InvoiceIndex() {
    const { t, i18n } = useTranslation();
    const { t: tInvoice } = useTranslation('management/invoice');
    const { props } = usePage<InertiaPageProps & PageProps>();
    const paginator = props.invoices;
    const rows: InvoiceRow[] = React.useMemo(
        () => paginator?.data ?? [],
        [paginator?.data],
    );
    const contracts = React.useMemo(
        () => props.options?.contracts ?? [],
        [props.options?.contracts],
    );
    const statuses = React.useMemo(
        () => props.options?.statuses ?? [],
        [props.options?.statuses],
    );
    const [start, setStart] = React.useState<string | null>(
        (props.query?.start as string | undefined) || null,
    );
    const [end, setEnd] = React.useState<string | null>(
        (props.query?.end as string | undefined) || null,
    );
    const setPreset = (days: number) => {
        const e = new Date();
        const s = new Date();
        s.setDate(e.getDate() - (days - 1));
        const toIso = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const ss = toIso(s);
        const ee = toIso(e);
        setStart(ss);
        setEnd(ee);
        onQueryChange({ page: 1, start: ss, end: ee });
    };
    const setPresetMTD = () => {
        const e = new Date();
        const s = new Date(e.getFullYear(), e.getMonth(), 1);
        const toIso = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const ss = toIso(s);
        const ee = toIso(e);
        setStart(ss);
        setEnd(ee);
        onQueryChange({ page: 1, start: ss, end: ee });
    };

    const [processing, setProcessing] = React.useState(false);
    const [genOpen, setGenOpen] = React.useState(false);

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
    const applyDates = React.useCallback(() => {
        onQueryChange({ page: 1, start: start || null, end: end || null });
    }, [start, end, onQueryChange]);
    const statusValue: string =
        (q as QueryBag & { status?: string | null }).status ?? 'all';
    const toIso = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const setPresetWTD = () => {
        const e = new Date();
        const dow = e.getDay();
        const mondayOffset = (dow + 6) % 7;
        const s = new Date(e);
        s.setDate(e.getDate() - mondayOffset);
        const ss = toIso(s);
        const ee = toIso(e);
        setStart(ss);
        setEnd(ee);
        onQueryChange({ page: 1, start: ss, end: ee });
    };
    const setPresetQTD = () => {
        const e = new Date();
        const qStartMonth = Math.floor(e.getMonth() / 3) * 3;
        const s = new Date(e.getFullYear(), qStartMonth, 1);
        const ss = toIso(s);
        const ee = toIso(e);
        setStart(ss);
        setEnd(ee);
        onQueryChange({ page: 1, start: ss, end: ee });
    };
    const setPresetYTD = () => {
        const e = new Date();
        const s = new Date(e.getFullYear(), 0, 1);
        const ss = toIso(s);
        const ee = toIso(e);
        setStart(ss);
        setEnd(ee);
        onQueryChange({ page: 1, start: ss, end: ee });
    };

    const [cancel, setCancel] = React.useState<CancelState>({
        target: null,
        reason: '',
    });
    const [extend, setExtend] = React.useState<ExtendState>({
        target: null,
        dueDate: '',
        reason: '',
    });

    const defaultTomorrow = React.useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    }, []);

    const [detail, setDetail] = React.useState<{
        id: string;
        number: string;
    } | null>(null);
    const lang = i18n.language;
    const tableColumns = React.useMemo(() => {
        void lang;
        return createColumns<InvoiceRow>({
            onCancel: (inv) => setCancel({ target: inv, reason: '' }),
            onShowDetail: (inv) =>
                setDetail({ id: inv.id, number: inv.number }),
            onExtendDue: (inv) =>
                setExtend({
                    target: inv,
                    dueDate: defaultTomorrow,
                    reason: '',
                }),
            onPrint: (inv) => {
                const url = route('management.invoices.print', inv.id);
                if (typeof window !== 'undefined') {
                    window.open(url, '_blank');
                }
            },
        });
    }, [defaultTomorrow, lang]);

    return (
        <AppLayout
            pageTitle={tInvoice('title')}
            pageDescription={tInvoice('list.title')}
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-3">
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
                                        {tInvoice('summary.pending', 'Pending')}
                                        :{' '}
                                        <span className="text-foreground font-medium">
                                            {props.summary.count_pending}
                                        </span>
                                    </span>
                                    <span className="mr-3">
                                        {tInvoice('summary.overdue', 'Overdue')}
                                        :{' '}
                                        <span className="text-foreground font-medium">
                                            {props.summary.count_overdue}
                                        </span>
                                    </span>
                                    <span>
                                        {tInvoice(
                                            'summary.outstanding',
                                            'Outstanding',
                                        )}
                                        :{' '}
                                        <span className="text-foreground font-medium">
                                            {formatIDR(
                                                props.summary.sum_outstanding,
                                            )}
                                        </span>
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-[160px_1fr_1fr_auto] md:items-end">
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
                                    <SelectTrigger className="w-[160px]">
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
                                                        `invoice.status.${slug}`,
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
                                <label className="text-muted-foreground mb-1 block text-xs">
                                    {t('dashboard.filters.start')}
                                </label>
                                <DatePickerInput
                                    value={start}
                                    onChange={setStart}
                                />
                            </div>
                            <div>
                                <label className="text-muted-foreground mb-1 block text-xs">
                                    {t('dashboard.filters.end')}
                                </label>
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
                        <div className="mt-3 flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-muted-foreground text-xs">
                                    {t('dashboard.filters.quick')}:
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setPreset(7)}
                                >
                                    7D
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setPreset(30)}
                                >
                                    30D
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setPreset(90)}
                                >
                                    90D
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={setPresetMTD}
                                >
                                    {t('dashboard.filters.mtd')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={setPresetWTD}
                                >
                                    {t('dashboard.filters.wtd')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={setPresetQTD}
                                >
                                    {t('dashboard.filters.qtd')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={setPresetYTD}
                                >
                                    {t('dashboard.filters.ytd')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground h-7 px-2 text-xs"
                                    onClick={() => {
                                        setStart(null);
                                        setEnd(null);
                                        onQueryChange({
                                            page: 1,
                                            start: null,
                                            end: null,
                                        });
                                    }}
                                >
                                    {t('common.reset')}
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
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
                                        if (start) qs.set('start', start);
                                        if (end) qs.set('end', end);
                                        const url = `${route('management.invoices.export')}${qs.toString() ? `?${qs.toString()}` : ''}`;
                                        if (typeof window !== 'undefined')
                                            window.open(url, '_blank');
                                    }}
                                >
                                    {t('common.export_csv')}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setGenOpen(true)}
                                >
                                    <FilePlus2 className="mr-2 h-4 w-4" />{' '}
                                    {tInvoice('generate.title')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <DataTableServer<InvoiceRow, unknown>
                            columns={tableColumns}
                            rows={rows}
                            paginator={paginator ?? null}
                            search={q.search}
                            onSearchChange={(v) =>
                                onQueryChange({ page: 1, search: v })
                            }
                            searchKey="number"
                            searchPlaceholder={t('nav.search.placeholder')}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText={tInvoice('list.empty')}
                            autoRefreshDefault="1m"
                            showRefresh={true}
                        />
                    </CardContent>
                </Card>
            </div>

            <GenerateInvoiceDialog
                open={genOpen}
                onOpenChange={setGenOpen}
                contracts={contracts}
            />

            <CancelInvoiceDialog
                target={cancel.target}
                onOpenChange={(v) => {
                    if (!v) setCancel({ target: null, reason: '' });
                }}
                onConfirm={(reason) => {
                    const inv = cancel.target;
                    if (!inv) return;
                    setProcessing(true);
                    router.post(
                        route('management.invoices.cancel', inv.id),
                        { reason },
                        {
                            preserveScroll: true,
                            onFinish: () => {
                                setProcessing(false);
                                setCancel({ target: null, reason: '' });
                            },
                        },
                    );
                }}
            />

            <InvoiceDetailDialog
                target={detail}
                onClose={() => setDetail(null)}
            />

            <ExtendDueDialog
                target={extend.target}
                open={!!extend.target}
                initialDueDate={defaultTomorrow}
                onOpenChange={(v) => {
                    if (!v)
                        setExtend({ target: null, dueDate: '', reason: '' });
                }}
                processing={processing}
                onConfirm={(dueDate, reason) => {
                    const inv = extend.target;
                    if (!inv) return;
                    setProcessing(true);
                    router.post(
                        route('management.invoices.extendDue', inv.id),
                        { due_date: dueDate, reason },
                        {
                            preserveScroll: true,
                            onFinish: () => {
                                setProcessing(false);
                                setExtend({
                                    target: null,
                                    dueDate: '',
                                    reason: '',
                                });
                            },
                        },
                    );
                }}
            />
        </AppLayout>
    );
}
