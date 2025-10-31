import { router } from '@inertiajs/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DataTableServer,
    type QueryBag,
} from '@/components/ui/data-table-server';
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
import {
    TenantInvoiceDetailDialog,
    TenantInvoicePayDialog,
} from '@/pages/tenant/invoice/dialogs';
import { createColumns } from '@/pages/tenant/invoice/tables/columns';
import type {
    TenantInvoiceIndexPageProps as PageProps,
    TenantInvoiceQueryInit as QueryInit,
    TenantInvoiceSafePayload as SafePayload,
    TenantInvoiceServerQuery as ServerQuery,
    TenantInvoiceItem,
} from '@/types/tenant';

export default function TenantInvoiceIndex(props: PageProps) {
    const { t, i18n } = useTranslation();
    const { t: tInv } = useTranslation('tenant/invoice');
    const { invoices: paginator, query = {}, options = {} } = props;
    const rows: TenantInvoiceItem[] = React.useMemo(
        () => paginator?.data ?? [],
        [paginator?.data],
    );
    const statuses = React.useMemo(
        () => options.statuses ?? [],
        [options.statuses],
    );

    const qinit = (query as QueryInit) || {};
    const initial: QueryBag | undefined = Object.keys(qinit).length
        ? {
              page: qinit.page,
              perPage: qinit.per_page,
              sort: qinit.sort ?? null,
              dir: qinit.dir ?? null,
              ...(qinit.status ? { status: qinit.status } : {}),
              ...(qinit.q ? { q: qinit.q, search: qinit.q } : {}),
          }
        : undefined;

    const [processing, setProcessing] = React.useState(false);
    const currentPath = React.useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );
    const { q, onQueryChange, handleSortChange } = useServerTable({
        paginator,
        initial,
        currentPath,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    });

    const [status, setStatus] = React.useState<string>(
        String((query as { status?: string | null }).status ?? ''),
    );
    // Search is handled by DataTableServer; no local keyword input here

    const safeOnQueryChange = React.useCallback(
        (payload: SafePayload) => {
            const merged: Record<string, unknown> = { ...payload };
            Object.keys(merged).forEach((k) => {
                if (merged[k] === undefined) delete merged[k];
            });
            // Normalize search: map to `q` for server while using `search` for table state
            if (Object.prototype.hasOwnProperty.call(merged, 'search')) {
                const val = merged['search'] as string | null | undefined;
                if (val === null) delete merged['search'];
                // also reflect into `q` param
                merged['q'] = val ?? null;
            }
            onQueryChange(merged as ServerQuery);
        },
        [onQueryChange],
    );

    const applyFilters = () => {
        // Apply only non-search filters; search is handled by table toolbar
        const payload: Record<string, unknown> = {
            page: 1,
            status: status || null,
            sort: q.sort ?? null,
            dir: q.dir ?? null,
        };
        safeOnQueryChange(payload as SafePayload);
    };

    const resetFilter = React.useCallback(() => {
        setStatus('');
        // Do not reset search here; only reset filters
        safeOnQueryChange({ page: 1, status: null } as SafePayload);
    }, [safeOnQueryChange]);

    const [detail, setDetail] = React.useState<null | {
        id: string;
        number: string;
    }>(null);
    const [pay, setPay] = React.useState<null | { id: string; number: string }>(
        null,
    );
    const lang = i18n.language;
    const columns = React.useMemo(() => {
        void lang;
        return createColumns({
            onPay: (row: TenantInvoiceItem) =>
                setPay({ id: row.id, number: row.number }),
            onShowDetail: (row: TenantInvoiceItem) =>
                setDetail({ id: row.id, number: row.number }),
        });
    }, [lang]);

    React.useEffect(() => {
        const handler = () => {
            try {
                router.reload({ only: ['invoices'] });
            } catch (e) {
                void e;
            }
        };
        window.addEventListener('tenant:invoices:refresh', handler);
        return () =>
            window.removeEventListener('tenant:invoices:refresh', handler);
    }, []);

    return (
        <AppLayout pageTitle={tInv('title')} pageDescription={tInv('desc')}>
            <div className="space-y-6">
                {/* Filter (only non-search filters) */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            {tInv('filter')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid items-end gap-3 md:grid-cols-2">
                            <div>
                                <Label
                                    htmlFor="status"
                                    className="text-muted-foreground mb-1 block text-xs"
                                >
                                    {t('common.status')}
                                </Label>
                                <Select
                                    value={status}
                                    onValueChange={(v) => {
                                        setStatus(v);
                                        safeOnQueryChange({
                                            page: 1,
                                            status: v,
                                        });
                                    }}
                                >
                                    <SelectTrigger id="status" className="h-9 w-full md:w-[180px]">
                                        <SelectValue
                                            placeholder={t('common.all')}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(statuses || []).map((s) => {
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
                        </div>
                        <div className="flex gap-2 pt-2 md:col-span-12">
                            <Button type="button" onClick={applyFilters}>
                                {t('common.apply')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetFilter}
                            >
                                {t('common.reset')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                        {/* Table */}
                <Card>
                    <CardContent>
                        <DataTableServer<TenantInvoiceItem, unknown>
                            columns={columns}
                            rows={rows}
                            paginator={paginator ?? null}
                            autoRefreshDefault="15s"
                            showRefresh={false}
                            search={q.search}
                            onSearchChange={(v) =>
                                safeOnQueryChange({
                                    page: 1,
                                    search: v,
                                    q: v || null,
                                } as SafePayload)
                            }
                            searchKey="number"
                            searchPlaceholder={t('nav.search.placeholder')}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={safeOnQueryChange}
                            loading={processing}
                            emptyText={t('invoice.empty')}
                            showColumn={false}
                            onRowClick={(row) =>
                                setDetail({ id: row.id, number: row.number })
                            }
                        />
                    </CardContent>
                </Card>

                {/* Detail Dialog */}
                <TenantInvoiceDetailDialog
                    target={detail}
                    onClose={() => setDetail(null)}
                    onPay={(id: string, number?: string) =>
                        setPay({ id, number: number || '' })
                    }
                />
                <TenantInvoicePayDialog
                    target={pay}
                    onClose={() => setPay(null)}
                />
            </div>
        </AppLayout>
    );
}
