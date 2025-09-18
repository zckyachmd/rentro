import { router, usePage } from '@inertiajs/react';
import { FilePlus2 } from 'lucide-react';
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
import type { QueryBag } from '@/components/ui/data-table-server';
import { DataTableServer } from '@/components/ui/data-table-server';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import type {
    ManagementCancelState as CancelState,
    ManagementExtendState as ExtendState,
    InvoiceRow,
    ManagementInvoicePageProps as PageProps,
} from '@/types/management';

import { createColumns } from './columns';
import InvoiceDetailDialog from './dialogs/detail';
import GenerateInvoiceDialog from './dialogs/generate';

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

    // CancelState, ExtendState moved to types

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
    const tableColumns = React.useMemo(
        () =>
            createColumns<InvoiceRow>({
                onCancel: (inv) => setCancel({ target: inv, reason: '' }),
                onShowDetail: (inv) =>
                    setDetail({ id: inv.id, number: inv.number }),
                onExtendDue: (inv) =>
                    setExtend({
                        target: inv,
                        dueDate: defaultTomorrow,
                        reason: '',
                    }),
            }),
        [defaultTomorrow],
    );

    const onExtendCancel = React.useCallback(() => {
        setExtend({ target: null, dueDate: '', reason: '' });
    }, []);

    const canExtendSave = !!extend.dueDate && extend.reason.trim().length >= 3;

    const onExtendSubmit = React.useCallback(() => {
        const inv = extend.target;
        if (!inv || !extend.dueDate) return;
        setProcessing(true);
        router.post(
            route('management.invoices.extendDue', inv.id),
            {
                due_date: extend.dueDate,
                reason: extend.reason,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setExtend({ target: null, dueDate: '', reason: '' });
                },
            },
        );
    }, [extend]);

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
                                    type="button"
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

            {/* Cancel Invoice Dialog */}
            <AlertDialog
                open={!!cancel.target}
                onOpenChange={(v) => {
                    if (!v) {
                        setCancel({ target: null, reason: '' });
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Batalkan Invoice</AlertDialogTitle>
                        <AlertDialogDescription>
                            {cancel.target ? (
                                <>
                                    Anda akan membatalkan invoice{' '}
                                    <span className="font-mono font-semibold">
                                        {cancel.target.number}
                                    </span>
                                    . Tindakan ini tidak dapat dibatalkan.
                                </>
                            ) : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-2">
                        <Label>Alasan pembatalan</Label>
                        <Textarea
                            value={cancel.reason}
                            onChange={(e) =>
                                setCancel((s) => ({
                                    ...s,
                                    reason: e.target.value,
                                }))
                            }
                            placeholder="Contoh: duplikasi tagihan, salah nominal, dll."
                            required
                            rows={3}
                            autoFocus
                            maxLength={200}
                        />
                        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Wajib diisi. Jelaskan secara singkat.</span>
                            <span>{cancel.reason.length}/200</span>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={!cancel.reason.trim()}
                            onClick={() => {
                                const inv = cancel.target;
                                if (!inv) return;
                                setProcessing(true);
                                router.post(
                                    route('management.invoices.cancel', inv.id),
                                    { reason: cancel.reason },
                                    {
                                        preserveScroll: true,
                                        onFinish: () => {
                                            setProcessing(false);
                                            setCancel({
                                                target: null,
                                                reason: '',
                                            });
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
                target={detail}
                onClose={() => setDetail(null)}
            />

            {/* Extend Due Dialog */}
            <Dialog
                open={!!extend.target}
                onOpenChange={(v) => {
                    if (!v) {
                        setExtend({ target: null, dueDate: '', reason: '' });
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Perpanjang Jatuh Tempo</DialogTitle>
                        <DialogDescription>
                            Atur tanggal jatuh tempo baru untuk invoice
                            Pending/Overdue ini dan berikan alasan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2">
                            <Label>Tanggal Jatuh Tempo Baru</Label>
                            <DatePickerInput
                                value={extend.dueDate}
                                onChange={(v) =>
                                    setExtend((s) => ({
                                        ...s,
                                        dueDate: v ?? '',
                                    }))
                                }
                                min={defaultTomorrow}
                                placeholder="Pilih tanggal"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Alasan perpanjangan</Label>
                            <Textarea
                                value={extend.reason}
                                onChange={(e) =>
                                    setExtend((s) => ({
                                        ...s,
                                        reason: e.target.value,
                                    }))
                                }
                                placeholder="Contoh: memberi keringanan, kendala transfer, dsb."
                                rows={3}
                                required
                                maxLength={200}
                            />
                            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                                {extend.reason.length}/200
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onExtendCancel}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            disabled={!canExtendSave || processing}
                            onClick={onExtendSubmit}
                        >
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthLayout>
    );
}
