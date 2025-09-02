import { router, usePage } from '@inertiajs/react';
import { FilePlus2, RefreshCw } from 'lucide-react';
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
import type {
    PaginatorMeta,
    QueryBag,
} from '@/components/ui/data-table-server';
import { DataTableServer } from '@/components/ui/data-table-server';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useServerTable } from '@/hooks/use-datatable';
import AuthLayout from '@/layouts/auth-layout';

import { createColumns } from './columns';
import GenerateInvoiceDialog from './generate-dialog';
import InvoiceDetailDialog from './detail-dialog';
import type { ContractOption, InvoiceRow } from './types';

type PageProps = {
    invoices?: { data: InvoiceRow[] } & PaginatorMeta;
    options?: { statuses: string[]; contracts: ContractOption[] };
    filters?: { status?: string | null };
    query?: QueryBag & { status?: string | null };
};

export default function InvoiceIndex() {
    const { props } = usePage<PageProps>();
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
    const statusValue: string =
        (q as QueryBag & { status?: string | null }).status ?? 'all';

    const reload = React.useCallback(() => {
        setProcessing(true);
        router.reload({
            preserveUrl: true,
            onFinish: () => setProcessing(false),
        });
    }, []);

    const [cancelTarget, setCancelTarget] = React.useState<InvoiceRow | null>(
        null,
    );
    const [cancelReason, setCancelReason] = React.useState('');
    const [detailTarget, setDetailTarget] = React.useState<{
        id: string;
        number: string;
    } | null>(null);
    const onCancel = React.useCallback((inv: InvoiceRow) => {
        setCancelTarget(inv);
    }, []);

    React.useEffect(() => {
        if (cancelTarget) setCancelReason('');
    }, [cancelTarget]);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const openId = params.get('open') || params.get('invoice');
        if (openId) {
            setDetailTarget({ id: openId, number: '' });
            params.delete('open');
            params.delete('invoice');
            const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
            window.history.replaceState({}, '', next);
        }
    }, []);

    const tableColumns = React.useMemo(
        () =>
            createColumns({
                onCancel,
                onShowDetail: (inv) =>
                    setDetailTarget({ id: inv.id, number: inv.number }),
            }),
        [onCancel],
    );

    return (
        <AuthLayout
            pageTitle="Tagihan"
            pageDescription="Kelola semua invoice yang dibuat, termasuk melihat status dan melakukan pembatalan."
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Daftar Tagihan</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Lihat dan kelola semua tagihan yang telah dibuat.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full flex-1 items-center gap-2">
                                <div className="flex items-center gap-2">
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
                                            <SelectValue placeholder="Semua status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua status
                                            </SelectItem>
                                            {statuses.map((s) => (
                                                <SelectItem key={s} value={s}>
                                                    {s}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={reload}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" /> Muat
                                    ulang
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setGenOpen(true)}
                                >
                                    <FilePlus2 className="mr-2 h-4 w-4" />{' '}
                                    Generate Invoice
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
                            searchPlaceholder="Cari nomor/penyewa/kamar…"
                            sort={q.sort}
                            dir={q.dir}
                            onSortChange={handleSortChange}
                            onQueryChange={onQueryChange}
                            loading={processing}
                            emptyText="Tidak ada invoice."
                        />
                    </CardContent>
                </Card>
            </div>

            <GenerateInvoiceDialog
                open={genOpen}
                onOpenChange={setGenOpen}
                contracts={contracts}
            />

            {/* Cancel Invoice Dialog */}
            <AlertDialog
                open={!!cancelTarget}
                onOpenChange={(v) => {
                    if (!v) {
                        setCancelTarget(null);
                        setCancelReason('');
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Batalkan Invoice</AlertDialogTitle>
                        <AlertDialogDescription>
                            {cancelTarget ? (
                                <>
                                    Anda akan membatalkan invoice{' '}
                                    <span className="font-mono font-semibold">
                                        {cancelTarget.number}
                                    </span>
                                    . Tindakan ini tidak dapat dibatalkan.
                                </>
                            ) : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-2">
                        <Label>Alasan pembatalan</Label>
                        <Textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Contoh: duplikasi tagihan, salah nominal, dll."
                            required
                            rows={3}
                            autoFocus
                            maxLength={200}
                        />
                        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Wajib diisi. Jelaskan secara singkat.</span>
                            <span>{cancelReason.length}/200</span>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={!cancelReason.trim()}
                            onClick={() => {
                                const inv = cancelTarget;
                                if (!inv) return;
                                setProcessing(true);
                                router.post(
                                    route('management.invoices.cancel', inv.id),
                                    { reason: cancelReason },
                                    {
                                        preserveScroll: true,
                                        onFinish: () => {
                                            setProcessing(false);
                                            setCancelTarget(null);
                                            setCancelReason('');
                                        },
                                    },
                                );
                            }}
                        >
                            Batalkan Sekarang
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <InvoiceDetailDialog
                target={detailTarget}
                onClose={() => setDetailTarget(null)}
            />
        </AuthLayout>
    );
}
