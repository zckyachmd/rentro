import { router } from '@inertiajs/react';
import { Filter, Plus, RefreshCw, Search } from 'lucide-react';
import React from 'react';

import { DatePickerInput } from '@/components/date-picker';
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
import {
    DataTableServer,
    type PaginatorMeta,
    type QueryBag,
} from '@/components/ui/data-table-server';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import {
    createColumns,
    type ContractItem,
} from '@/pages/management/contract/columns';

type ContractsPaginator = { data: ContractItem[] } & PaginatorMeta;

interface ContractsPageProps {
    contracts?: ContractsPaginator;
    query?: QueryBag & { status?: string | null; q?: string | null };
    options?: { statuses?: { value: string; label: string }[] };
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

export default function ContractIndex(props: ContractsPageProps) {
    const { contracts: paginator, query = {}, options = {} } = props;
    const contracts: ContractItem[] = (paginator?.data ?? []) as ContractItem[];
    const statuses = React.useMemo(
        () => options.statuses ?? [],
        [options.statuses],
    );

    const [status, setStatus] = React.useState<string>(
        String((query as { status?: string | null }).status ?? ''),
    );
    const [keyword, setKeyword] = React.useState<string>(
        String((query as { q?: string | null }).q ?? ''),
    );

    type QueryInit = Partial<{
        page: number;
        per_page: number;
        perPage: number;
        sort: string | null;
        dir: 'asc' | 'desc' | null;
        status: string | null;
        q: string | null;
    }>;
    const qinit = (query as QueryInit) || {};
    const initial: QueryBag | undefined = Object.keys(qinit).length
        ? {
              page: qinit.page,
              perPage: qinit.per_page ?? qinit.perPage,
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
        if (trimmedQ) {
            payload.q = trimmedQ;
        } else if (hadQ) {
            payload.q = null;
        }
        safeOnQueryChange(payload as SafePayload);
    };

    const resetFilter = React.useCallback(() => {
        setStatus('');
        setKeyword('');
        safeOnQueryChange({ page: 1, status: null, q: null } as SafePayload);
    }, [safeOnQueryChange]);

    // Action dialog states
    type Target = ContractItem | null;
    const [cancelTarget, setCancelTarget] = React.useState<Target>(null);
    const [toggleTarget, setToggleTarget] = React.useState<Target>(null);
    const [extendTarget, setExtendTarget] = React.useState<Target>(null);
    const defaultTomorrow = React.useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    }, []);
    const [extendDueDate, setExtendDueDate] = React.useState<string>('');

    const tableColumns = React.useMemo(
        () =>
            createColumns({
                onCancel: (c) => setCancelTarget(c),
                onExtendDue: (c) => {
                    setExtendTarget(c);
                    setExtendDueDate(defaultTomorrow);
                },
                onStopAutoRenew: (c) => setToggleTarget(c),
                onStartAutoRenew: (c) => setToggleTarget(c),
            }),
        [defaultTomorrow],
    );

    const headerActions = (
        <div className="flex items-center gap-2">
            <Button
                type="button"
                onClick={() =>
                    router.visit(route('management.contracts.create'))
                }
            >
                <Plus className="mr-2 h-4 w-4" /> Buat Kontrak
            </Button>
        </div>
    );

    return (
        <AuthLayout
            pageTitle="Kontrak"
            pageDescription="Kelola kontrak penyewa dan status perpanjangan."
            titleIcon="ScrollText"
            actions={headerActions}
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Filter className="h-4 w-4" /> Filter
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
                                        placeholder="Cari penyewa/kamar…"
                                        aria-label="Cari penyewa atau kamar"
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
                                <RefreshCw className="mr-2 h-4 w-4" /> Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <DataTableServer<ContractItem, unknown>
                            columns={tableColumns}
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
            </div>

            {/* Cancel Contract Dialog */}
            <AlertDialog
                open={!!cancelTarget}
                onOpenChange={(v) => !v && setCancelTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Batalkan Kontrak</AlertDialogTitle>
                        <AlertDialogDescription>
                            Konfirmasi untuk membatalkan kontrak ini. Status
                            akan menjadi Cancelled dan auto‑renew dimatikan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                const c = cancelTarget;
                                if (!c) return;
                                router.post(
                                    route('management.contracts.cancel', {
                                        contract: c.id,
                                    }),
                                    {},
                                    {
                                        preserveScroll: true,
                                        onFinish: () => setCancelTarget(null),
                                    },
                                );
                            }}
                        >
                            Ya, Batalkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Toggle Auto‑renew Dialog */}
            <AlertDialog
                open={!!toggleTarget}
                onOpenChange={(v) => !v && setToggleTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {toggleTarget?.auto_renew
                                ? 'Hentikan Auto‑renew'
                                : 'Nyalakan Auto‑renew'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {toggleTarget?.auto_renew
                                ? 'Kontrak tidak akan diperpanjang otomatis di akhir periode.'
                                : 'Kontrak akan diperpanjang otomatis di akhir periode.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                const c = toggleTarget;
                                if (!c) return;
                                const routeName = c.auto_renew
                                    ? 'management.contracts.stopAutoRenew'
                                    : 'management.contracts.startAutoRenew';
                                router.post(
                                    route(routeName, { contract: c.id }),
                                    {},
                                    {
                                        preserveScroll: true,
                                        onFinish: () => setToggleTarget(null),
                                    },
                                );
                            }}
                        >
                            Konfirmasi
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Extend Due Dialog */}
            <Dialog
                open={!!extendTarget}
                onOpenChange={(v) => !v && setExtendTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Perpanjang Tenggat Pembayaran</DialogTitle>
                        <DialogDescription>
                            Atur tanggal jatuh tempo baru untuk invoice pending
                            dari kontrak ini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Tanggal Jatuh Tempo Baru</Label>
                        <DatePickerInput
                            value={extendDueDate}
                            onChange={(v) => setExtendDueDate(v ?? '')}
                            min={defaultTomorrow}
                            placeholder="Pilih tanggal jatuh tempo"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Wajib setelah hari ini.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setExtendTarget(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={() => {
                                const c = extendTarget;
                                if (!c || !extendDueDate) return;
                                router.post(
                                    route('management.contracts.extendDue', {
                                        contract: c.id,
                                    }),
                                    { due_date: extendDueDate },
                                    {
                                        preserveScroll: true,
                                        onFinish: () => setExtendTarget(null),
                                    },
                                );
                            }}
                            disabled={!extendDueDate}
                        >
                            Simpan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AuthLayout>
    );
}
