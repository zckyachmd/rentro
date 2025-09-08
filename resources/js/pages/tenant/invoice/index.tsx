import { RefreshCw, Search } from 'lucide-react';
import React from 'react';

// Types for Midtrans Snap and config
type SnapCallbacks = {
    onSuccess: () => void;
    onPending: () => void;
    onError: () => void;
    onClose: () => void;
};

type Snap = {
    pay: (token: string, callbacks: SnapCallbacks) => void;
};

type MidtransConfig = { client_key: string; is_production: boolean };

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DataTableServer,
    type PaginatorMeta,
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
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';

import { createColumns, type TenantInvoiceItem } from './columns';
import TenantInvoiceDetailDialog from './detail-dialog';

type InvoicesPaginator = { data: TenantInvoiceItem[] } & PaginatorMeta;

type PageProps = {
    invoices?: InvoicesPaginator;
    query?: QueryBag & { status?: string | null; q?: string | null };
    options?: { statuses?: string[] };
    midtrans?: MidtransConfig;
};

type QueryInit = Partial<{
    page: number;
    per_page: number;
    sort: string | null;
    dir: 'asc' | 'desc' | null;
    status: string | null;
    q: string | null;
}>;

type SafePayload = Partial<{
    page: number;
    per_page: number;
    sort: string | null;
    dir: 'asc' | 'desc' | null;
    status: string | null;
    q: string | null;
}>;

type ServerQuery = {
    [key: string]: unknown;
    page?: number;
    per_page?: number;
    search?: string | undefined;
    sort?: string | null;
    dir?: 'asc' | 'desc' | null;
};

export default function TenantInvoiceIndex(props: PageProps) {
    const { invoices: paginator, query = {}, options = {}, midtrans } = props;
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

    const ensureSnap = React.useCallback(
        async (clientKey: string, prod: boolean) => {
            const snapExisting = (window as Window & { snap?: Snap }).snap;
            if (snapExisting && typeof snapExisting.pay === 'function') return;
            const host = prod
                ? 'https://app.midtrans.com'
                : 'https://app.sandbox.midtrans.com';
            await new Promise<void>((resolve, reject) => {
                const s = document.createElement('script');
                s.src = host + '/snap/snap.js';
                s.async = true;
                s.setAttribute('data-client-key', clientKey);
                s.onload = () => resolve();
                s.onerror = () => reject(new Error('Failed to load Snap.js'));
                document.head.appendChild(s);
            });
        },
        [],
    );

    const payWithSnap = React.useCallback(
        async (invoiceId: string) => {
            const mid = midtrans;
            if (!mid?.client_key) {
                alert('Konfigurasi pembayaran belum siap.');
                return;
            }
            try {
                setProcessing(true);
                await ensureSnap(mid.client_key, Boolean(mid.is_production));
                const url = route('tenant.invoices.pay.midtrans', {
                    invoice: invoiceId,
                });
                const token =
                    (
                        document.head.querySelector(
                            'meta[name="csrf-token"]',
                        ) as HTMLMetaElement
                    )?.content || '';
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': token,
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({}),
                });
                if (!res.ok) throw new Error(await res.text());
                const json = await res.json();
                const snap = (window as Window & { snap?: Snap }).snap;
                if (snap && typeof snap.pay === 'function' && json.token) {
                    snap.pay(json.token, {
                        onSuccess: () => window.location.reload(),
                        onPending: () => window.location.reload(),
                        onError: () => window.location.reload(),
                        onClose: () => {},
                    });
                } else if (json.redirect_url) {
                    window.location.href = json.redirect_url;
                } else {
                    alert(
                        'Transaksi dibuat, tetapi token Snap tidak tersedia.',
                    );
                }
            } catch (e) {
                console.error(e);
                alert('Gagal memulai pembayaran.');
            } finally {
                setProcessing(false);
            }
        },
        [ensureSnap, midtrans],
    );

    const [detail, setDetail] = React.useState<null | {
        id: string;
        number: string;
    }>(null);
    const columns = React.useMemo(
        () =>
            createColumns({
                onPay: (row) => payWithSnap(row.id),
                onView: (row) => setDetail({ id: row.id, number: row.number }),
                onPrint: (row) =>
                    window.open(
                        route('tenant.invoices.print', { invoice: row.id }),
                        '_blank',
                    ),
            }),
        [payWithSnap],
    );

    return (
        <AuthLayout
            pageTitle="Tagihan Saya"
            pageDescription="Daftar tagihan dan pembayaran."
        >
            <div className="space-y-6">
                {/* Filter */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid items-end gap-3 md:grid-cols-2">
                            <div>
                                <Label htmlFor="invoice-search">Cari</Label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                                        placeholder="Cari nomor invoice/kamar…"
                                        aria-label="Cari invoice"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="status">Status</Label>
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
                                        <SelectValue placeholder="Semua" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(statuses || []).map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2 md:col-span-12">
                            <Button type="button" onClick={applyFilters}>
                                Terapkan
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetFilter}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> Reset
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
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={safeOnQueryChange}
                            loading={processing}
                            emptyText="Tidak ada tagihan."
                            showColumn={false}
                        />
                    </CardContent>
                </Card>

                {/* Detail Dialog */}
                <TenantInvoiceDetailDialog
                    target={detail}
                    onClose={() => setDetail(null)}
                />
            </div>
        </AuthLayout>
    );
}
