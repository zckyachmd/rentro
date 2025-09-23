import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DataTableServer,
    type QueryBag,
} from '@/components/ui/data-table-server';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import TenantInvoiceDetailDialog from '@/features/tenant/invoice/dialogs/detail-dialog';
import TenantInvoicePayDialog from '@/features/tenant/invoice/dialogs/pay-dialog';
import { createColumns } from '@/features/tenant/invoice/tables/columns';
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';
import type {
    TenantInvoiceIndexPageProps as PageProps,
    TenantInvoiceQueryInit as QueryInit,
    TenantInvoiceSafePayload as SafePayload,
    TenantInvoiceServerQuery as ServerQuery,
    TenantInvoiceItem,
} from '@/types/tenant';

export default function TenantInvoiceIndex(props: PageProps) {
    const { t } = useTranslation();
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
              ...(qinit.q ? { q: qinit.q } : {}),
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
    const [keyword, setKeyword] = React.useState<string>(
        String((query as { q?: string | null }).q ?? ''),
    );

    const safeOnQueryChange = React.useCallback(
        (payload: SafePayload) => {
            const merged: Record<string, unknown> = { ...payload };
            Object.keys(merged).forEach((k) => {
                if (merged[k] === undefined) delete merged[k];
            });
            if (
                Object.prototype.hasOwnProperty.call(merged, 'search') &&
                merged['search'] === null
            )
                delete merged['search'];
            onQueryChange(merged as ServerQuery);
        },
        [onQueryChange],
    );

    const applyFilters = () => {
        const trimmedQ = (keyword || '').trim();
        const hadQ =
            'q' in (q as Record<string, unknown>) &&
            Boolean((q as Record<string, unknown>).q);
        const payload: Record<string, unknown> = {
            page: 1,
            status: status || null,
            sort: q.sort ?? null,
            dir: q.dir ?? null,
        };
        if (trimmedQ) payload.q = trimmedQ;
        else if (hadQ) payload.q = null;
        safeOnQueryChange(payload as SafePayload);
    };

    const resetFilter = React.useCallback(() => {
        setStatus('');
        setKeyword('');
        safeOnQueryChange({ page: 1, status: null, q: null } as SafePayload);
    }, [safeOnQueryChange]);

    const [detail, setDetail] = React.useState<null | {
        id: string;
        number: string;
    }>(null);
    const [pay, setPay] = React.useState<null | { id: string; number: string }>(
        null,
    );
    const columns = React.useMemo(
        () =>
            createColumns({
                onPay: (row: TenantInvoiceItem) =>
                    setPay({ id: row.id, number: row.number }),
                onShowDetail: (row: TenantInvoiceItem) =>
                    setDetail({ id: row.id, number: row.number }),
            }),
        [],
    );

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
        <AuthLayout
            pageTitle={t('tenant.invoice.title')}
            pageDescription={t('tenant.invoice.desc')}
        >
            <div className="space-y-6">
                {/* Filter */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            {t('tenant.invoice.filter')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid items-end gap-3 md:grid-cols-2">
                            <div>
                                <Label htmlFor="invoice-search">
                                    {t('tenant.invoice.search')}
                                </Label>
                                <div className="relative">
                                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
                                    <Input
                                        id="invoice-search"
                                        className="h-9 pl-8"
                                        value={keyword}
                                        onChange={(e) =>
                                            setKeyword(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                applyFilters();
                                            }
                                        }}
                                        placeholder={t(
                                            'tenant.invoice.search_placeholder',
                                        )}
                                        aria-label={t('tenant.invoice.search')}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="status">
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
                                    <SelectTrigger id="status" className="h-9">
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
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={safeOnQueryChange}
                            loading={processing}
                            emptyText={t('invoice.empty')}
                            showColumn={false}
                        />
                    </CardContent>
                </Card>

                {/* Detail Dialog */}
                <TenantInvoiceDetailDialog
                    target={detail}
                    onClose={() => setDetail(null)}
                    onPay={(id, number) => setPay({ id, number: number || '' })}
                />
                <TenantInvoicePayDialog
                    target={pay}
                    onClose={() => setPay(null)}
                />
            </div>
        </AuthLayout>
    );
}
