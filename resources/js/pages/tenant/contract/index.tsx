import { router } from '@inertiajs/react';
import { AlertTriangle, Search } from 'lucide-react';
import React from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';

import { createColumns, type TenantContractItem } from './columns';

type ContractsPaginator = { data: TenantContractItem[] } & PaginatorMeta;

interface ContractsPageProps {
    contracts?: ContractsPaginator;
    query?: QueryBag & { status?: string | null; q?: string | null };
    options?: {
        statuses?: { value: string; label: string }[];
        forfeit_days?: number;
    };
}

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

export default function TenantContractIndex(props: ContractsPageProps) {
    const { contracts: paginator, query = {}, options = {} } = props;
    const contracts: TenantContractItem[] = (paginator?.data ??
        []) as TenantContractItem[];
    const statuses = React.useMemo(
        () => options.statuses ?? [],
        [options.statuses],
    );
    const forfeitDays = React.useMemo(
        () => Number(options.forfeit_days ?? 7),
        [options.forfeit_days],
    );

    const [status, setStatus] = React.useState<string>(
        String((query as { status?: string | null }).status ?? ''),
    );
    const [keyword, setKeyword] = React.useState<string>(
        String((query as { q?: string | null }).q ?? ''),
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

    const currentPath = React.useMemo(
        () => (typeof window !== 'undefined' ? window.location.pathname : '/'),
        [],
    );

    const [processing, setProcessing] = React.useState(false);

    const { q, onQueryChange, handleSortChange } = useServerTable({
        paginator,
        initial,
        currentPath,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    });

    const safeOnQueryChange = React.useCallback(
        (payload: SafePayload) => {
            const merged: Record<string, unknown> = { ...payload };
            Object.keys(merged).forEach((k) => {
                if (merged[k] === undefined) delete merged[k];
            });
            if (
                Object.prototype.hasOwnProperty.call(merged, 'search') &&
                merged['search'] === null
            ) {
                delete merged['search'];
            }
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

    const [stopTarget, setStopTarget] =
        React.useState<TenantContractItem | null>(null);
    const [ack, setAck] = React.useState(false);

    const daysUntil = (end?: string | null): number | null => {
        if (!end) return null;
        const endDate = new Date(end);
        const today = new Date();
        const d0 = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
        );
        const d1 = new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate(),
        );
        const diffMs = d1.getTime() - d0.getTime();
        return Math.max(0, Math.ceil(diffMs / 86_400_000));
    };

    return (
        <AuthLayout
            pageTitle="Kontrak Saya"
            pageDescription="Daftar kontrak kamar Anda."
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
                                <Label htmlFor="contract-search">Cari</Label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="contract-search"
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
                                        placeholder="Cari nomor kontrak/kamar…"
                                        aria-label="Cari nomor kontrak atau kamar"
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
                                        <SelectGroup>
                                            {statuses.map((s) => (
                                                <SelectItem
                                                    key={s.value}
                                                    value={s.value}
                                                >
                                                    {s.label}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
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
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent>
                        <DataTableServer<TenantContractItem, unknown>
                            columns={createColumns({
                                onStopAutoRenew: (row) => setStopTarget(row),
                            })}
                            rows={contracts}
                            paginator={paginator ?? null}
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={safeOnQueryChange}
                            loading={processing}
                            emptyText="Tidak ada kontrak."
                            showColumn={false}
                        />
                    </CardContent>
                </Card>

                <AlertDialog
                    open={!!stopTarget}
                    onOpenChange={(v) => {
                        if (!v) {
                            setStopTarget(null);
                            setAck(false);
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Nonaktifkan Perpanjangan Otomatis
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menonaktifkan
                                perpanjangan otomatis kontrak ini? Jika
                                dinonaktifkan, kontrak tidak akan diperpanjang
                                secara otomatis setelah berakhir. Untuk
                                mengaktifkan kembali perpanjangan otomatis,
                                silakan hubungi admin.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        {/* Ringkasan singkat */}
                        <div className="rounded-md border bg-muted/40 p-3 text-sm">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="min-w-0">
                                    <div className="text-xs text-muted-foreground">
                                        Tanggal berakhir
                                    </div>
                                    <div className="font-medium">
                                        {stopTarget?.end_date
                                            ? new Date(
                                                  stopTarget.end_date,
                                              ).toLocaleDateString()
                                            : '-'}
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs text-muted-foreground">
                                        Sisa hari
                                    </div>
                                    <div className="font-mono tabular-nums">
                                        {(() => {
                                            const n = daysUntil(
                                                stopTarget?.end_date,
                                            );
                                            return n == null ? '-' : n;
                                        })()}
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs text-muted-foreground">
                                        Batas penalti deposit
                                    </div>
                                    <div className="font-mono tabular-nums">
                                        {forfeitDays} hari
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Peringatan / konsekuensi */}
                        <div className="space-y-3 py-2 text-sm">
                            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
                                <div className="flex items-center gap-2 font-medium">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Hal yang perlu diperhatikan:</span>
                                </div>
                                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                                    <li>
                                        Tidak ada jaminan perpanjangan jika
                                        kamar sudah dibooking penyewa lain.
                                    </li>
                                    {(() => {
                                        const d = daysUntil(
                                            stopTarget?.end_date,
                                        );
                                        if (d != null && d < forfeitDays) {
                                            return (
                                                <li>
                                                    Karena kurang dari{' '}
                                                    {forfeitDays} hari sebelum
                                                    tanggal berakhir,{' '}
                                                    <span className="font-semibold">
                                                        deposit Anda akan hangus
                                                    </span>{' '}
                                                    sesuai kebijakan.
                                                </li>
                                            );
                                        }
                                        return (
                                            <li>
                                                Jika penghentian dilakukan
                                                kurang dari {forfeitDays} hari
                                                sebelum tanggal berakhir,{' '}
                                                <span className="font-semibold">
                                                    deposit akan hangus
                                                </span>{' '}
                                                sesuai kebijakan.
                                            </li>
                                        );
                                    })()}
                                </ul>
                            </div>

                            <div className="flex items-start gap-2">
                                <Checkbox
                                    id="ack-stop-auto-renew"
                                    checked={ack}
                                    onCheckedChange={(v) => setAck(Boolean(v))}
                                />
                                <Label
                                    htmlFor="ack-stop-auto-renew"
                                    className="cursor-pointer leading-snug"
                                >
                                    Saya telah membaca dan memahami informasi di
                                    atas.
                                </Label>
                            </div>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                                disabled={!ack}
                                onClick={() => {
                                    const c = stopTarget;
                                    if (!c) return;
                                    setProcessing(true);
                                    router.post(
                                        route(
                                            'tenant.contracts.stopAutoRenew',
                                            { contract: c.id },
                                        ),
                                        { confirm: true },
                                        {
                                            preserveScroll: true,
                                            onFinish: () => {
                                                setProcessing(false);
                                                setStopTarget(null);
                                                setAck(false);
                                            },
                                        },
                                    );
                                }}
                            >
                                Nonaktifkan
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AuthLayout>
    );
}
