import { router } from '@inertiajs/react';
import { CheckCircle2, Eye, MoreHorizontal, XCircle } from 'lucide-react';
import React from 'react';

import AttachmentPreviewDialog from '@/components/attachment-preview';
import { Crumb } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import TenantHandoverDetailDialog from '@/features/tenant/contract/dialogs/handover-detail-dialog';
import { useLengthRule } from '@/hooks/use-length-rule';
import AuthLayout from '@/layouts/auth-layout';
import { createAbort, getJson } from '@/lib/api';
import { formatDate, formatIDR } from '@/lib/format';
import {
    variantForContractStatus,
    variantForInvoiceStatus,
} from '@/lib/status';
import type {
    TenantHandover as DialogHandover,
    TenantContractDetailPageProps as PageProps,
    TenantHandover,
} from '@/types/tenant';

const BREADCRUMBS: Crumb[] = [
    { label: 'Kontrak', href: route('tenant.contracts.index') },
    { label: 'Detail Kontrak', href: '#' },
];

export default function TenantContractDetail(props: PageProps) {
    const { contract, invoices } = props;
    const [handovers, setHandovers] = React.useState<TenantHandover[]>([]);
    const [loadingHandover, setLoadingHandover] = React.useState(false);
    const [preview, setPreview] = React.useState<{
        open: boolean;
        url: string;
        title?: string;
    }>({ open: false, url: '' });
    const [dispute, setDispute] = React.useState<{
        open: boolean;
        id?: string;
        note: string;
        saving: boolean;
    }>({ open: false, note: '', saving: false });
    const disputeRule = useLengthRule(dispute.note, {
        min: 5,
        required: true,
        trim: true,
    });
    const [confirmAck, setConfirmAck] = React.useState<{
        open: boolean;
        id?: string;
        saving: boolean;
    }>({ open: false, saving: false });
    const [handoverDialog, setHandoverDialog] = React.useState<{
        open: boolean;
        data: TenantHandover | null;
    }>({ open: false, data: null });
    const openHandover = (handover: TenantHandover) =>
        setHandoverDialog({ open: true, data: handover });

    const normalizeHandovers = React.useCallback(
        (items?: TenantHandover[]) =>
            (items ?? []).map((item) => ({
                ...item,
                attachments: Array.isArray(item.attachments)
                    ? item.attachments
                    : [],
            })),
        [],
    );

    const loadHandovers = React.useCallback(async () => {
        const ctrl = createAbort();
        try {
            setLoadingHandover(true);
            const j = await getJson<{ handovers?: TenantHandover[] }>(
                route('tenant.contracts.handovers.index', {
                    contract: contract.id,
                }),
                { signal: ctrl.signal },
            );
            setHandovers(normalizeHandovers(j.handovers));
        } catch {
            // ignore
        } finally {
            if (!ctrl.signal.aborted) setLoadingHandover(false);
        }
    }, [contract.id, normalizeHandovers]);

    React.useEffect(() => {
        loadHandovers();
    }, [loadHandovers]);

    return (
        <AuthLayout
            pageTitle={`Kontrak #${contract.number ?? contract.id}`}
            pageDescription="Detail kontrak Anda."
            breadcrumbs={BREADCRUMBS}
        >
            <div className="mb-2 flex items-center justify-end gap-3">
                <div className="hidden text-xs text-muted-foreground md:block">
                    Terakhir diperbarui: {formatDate(contract.updated_at, true)}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Kontrak</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Kamar</div>
                            <div className="font-medium">
                                {contract.room?.number ?? '-'}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Mulai</div>
                            <div>
                                {contract.start_date
                                    ? formatDate(contract.start_date)
                                    : '-'}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Selesai</div>
                            <div>
                                {contract.end_date
                                    ? formatDate(contract.end_date)
                                    : '-'}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Sewa</div>
                            <div className="font-semibold">
                                {formatIDR(contract.rent_cents)}
                            </div>
                        </div>
                        {typeof contract.deposit_cents === 'number' && (
                            <div className="flex items-center justify-between">
                                <div className="text-muted-foreground">
                                    Deposit
                                </div>
                                <div className="font-semibold">
                                    {formatIDR(contract.deposit_cents || 0)}
                                </div>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                Periode Tagih
                            </div>
                            <div>{contract.billing_period || '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                Tanggal Penagihan
                            </div>
                            <div>{contract.billing_day ?? '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Status</div>
                            <div>
                                <Badge
                                    variant={variantForContractStatus(
                                        contract.status,
                                    )}
                                >
                                    {contract.status}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Kamar</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Nama</div>
                            <div>{contract.room?.name ?? '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Gedung</div>
                            <div>{contract.room?.building?.name ?? '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Lantai</div>
                            <div>{contract.room?.floor?.level ?? '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">Tipe</div>
                            <div>{contract.room?.type?.name ?? '-'}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-muted-foreground">
                                Harga Kamar
                            </div>
                            <div className="font-semibold">
                                {formatIDR(contract.room?.price_cents || 0)}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Invoice */}
            <Card className="mt-6">
                <CardHeader className="pb-3">
                    <CardTitle>Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/30">
                                <tr>
                                    <th className="h-10 px-4 text-left">
                                        Nomor
                                    </th>
                                    <th className="h-10 px-4 text-left">
                                        Periode
                                    </th>
                                    <th className="h-10 px-4 text-left">
                                        Jatuh Tempo
                                    </th>
                                    <th className="h-10 px-4 text-left">
                                        Status
                                    </th>
                                    <th className="h-10 px-4 text-right">
                                        Jumlah
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.data.length ? (
                                    invoices.data.map((inv) => (
                                        <tr key={inv.id} className="border-b">
                                            <td className="px-4 py-2 font-mono text-xs">
                                                <a
                                                    href={`${route('tenant.invoices.index')}?q=${encodeURIComponent(inv.number)}`}
                                                    className="underline underline-offset-2 hover:opacity-80"
                                                    title="Lihat di halaman Tagihan"
                                                >
                                                    {inv.number}
                                                </a>
                                            </td>
                                            <td className="px-4 py-2">
                                                {(formatDate(
                                                    inv.period_start,
                                                ) ?? '-') +
                                                    ' s/d ' +
                                                    (formatDate(
                                                        inv.period_end,
                                                    ) ?? '-')}
                                            </td>
                                            <td className="px-4 py-2">
                                                {formatDate(inv.due_date)}
                                            </td>
                                            <td className="px-4 py-2">
                                                <Badge
                                                    variant={variantForInvoiceStatus(
                                                        inv.status,
                                                    )}
                                                >
                                                    {inv.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {formatIDR(inv.amount_cents)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            className="px-4 py-8 text-center text-sm text-muted-foreground"
                                            colSpan={5}
                                        >
                                            Tidak ada invoice.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Serah Terima */}
            <Card className="mt-6">
                <CardHeader className="pb-3">
                    <CardTitle>Serah Terima</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/30">
                                <tr className="align-middle">
                                    <th className="h-11 px-4 text-left align-middle">
                                        Jenis
                                    </th>
                                    <th className="h-11 px-4 text-left align-middle">
                                        Waktu
                                    </th>
                                    <th className="h-11 px-4 text-left align-middle">
                                        Status
                                    </th>
                                    <th className="h-11 px-4 text-right align-middle">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {handovers.length ? (
                                    handovers.map((h) => (
                                        <tr
                                            key={h.id}
                                            className="border-b align-middle"
                                        >
                                            <td className="px-4 py-3 align-middle capitalize">
                                                {h.type}
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                {formatDate(
                                                    h.recorded_at,
                                                    true,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                <Badge variant="outline">
                                                    {h.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right align-middle">
                                                <div className="flex items-center justify-end">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                aria-label="Aksi Serah Terima"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-56"
                                                        >
                                                            <DropdownMenuLabel>
                                                                Aksi
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openHandover(
                                                                        h,
                                                                    )
                                                                }
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Lihat detail
                                                            </DropdownMenuItem>
                                                            {String(
                                                                h.status || '',
                                                            ).toLowerCase() ===
                                                                'pending' &&
                                                                !h.acknowledged &&
                                                                !h.disputed && (
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            setConfirmAck(
                                                                                {
                                                                                    open: true,
                                                                                    id: h.id,
                                                                                    saving: false,
                                                                                },
                                                                            )
                                                                        }
                                                                    >
                                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                        Konfirmasi
                                                                    </DropdownMenuItem>
                                                                )}
                                                            {String(
                                                                h.status || '',
                                                            ).toLowerCase() ===
                                                                'pending' &&
                                                                !h.acknowledged &&
                                                                !h.disputed && (
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            setDispute(
                                                                                {
                                                                                    open: true,
                                                                                    id: h.id,
                                                                                    note: '',
                                                                                    saving: false,
                                                                                },
                                                                            )
                                                                        }
                                                                    >
                                                                        <XCircle className="mr-2 h-4 w-4" />
                                                                        Sanggah
                                                                    </DropdownMenuItem>
                                                                )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="align-middle">
                                        <td
                                            className="px-4 py-8 text-center align-middle text-sm text-muted-foreground"
                                            colSpan={4}
                                        >
                                            {loadingHandover
                                                ? 'Memuat…'
                                                : 'Belum ada riwayat serah terima.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog
                open={confirmAck.open}
                onOpenChange={(o) => setConfirmAck((p) => ({ ...p, open: o }))}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Serah Terima</DialogTitle>
                        <DialogDescription>
                            Pastikan Anda sudah meninjau catatan &amp; lampiran.
                            Aksi ini menandai serah terima sebagai telah Anda
                            setujui.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                        Setelah dikonfirmasi, Anda tetap dapat mengajukan
                        sanggahan melalui admin jika diperlukan, namun status
                        awal akan tercatat sebagai{' '}
                        <span className="font-medium text-foreground">
                            Dikonfirmasi
                        </span>
                        .
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setConfirmAck((p) => ({
                                    ...p,
                                    open: false,
                                }))
                            }
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            disabled={confirmAck.saving || !confirmAck.id}
                            onClick={async () => {
                                if (!confirmAck.id) return;
                                setConfirmAck((p) => ({
                                    ...p,
                                    saving: true,
                                }));
                                try {
                                    await new Promise<void>(
                                        (resolve, reject) => {
                                            router.post(
                                                route('tenant.handovers.ack', {
                                                    handover: confirmAck.id,
                                                }),
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        setConfirmAck({
                                                            open: false,
                                                            id: undefined,
                                                            saving: false,
                                                        });
                                                        setHandoverDialog({
                                                            open: false,
                                                            data: null,
                                                        });
                                                        router.reload({
                                                            only: ['contract'],
                                                        });
                                                        void loadHandovers();
                                                        resolve();
                                                    },
                                                    onError: () => {
                                                        setConfirmAck((p) => ({
                                                            ...p,
                                                            saving: false,
                                                        }));
                                                        reject(
                                                            new Error('Failed'),
                                                        );
                                                    },
                                                    onFinish: () => {
                                                        // no-op; handled above
                                                    },
                                                },
                                            );
                                        },
                                    );
                                } catch {
                                    setConfirmAck((p) => ({
                                        ...p,
                                        saving: false,
                                    }));
                                }
                            }}
                        >
                            {confirmAck.saving ? 'Menyimpan…' : 'Konfirmasi'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <TenantHandoverDetailDialog
                open={handoverDialog.open}
                onOpenChange={(o) =>
                    setHandoverDialog((s) => ({ ...s, open: o }))
                }
                handover={handoverDialog.data as DialogHandover | null}
                onRefetch={() => loadHandovers()}
            />
            <AttachmentPreviewDialog
                open={preview.open}
                onOpenChange={(o) => setPreview((p) => ({ ...p, open: o }))}
                url={preview.url}
                title={preview.title}
            />
            <Dialog
                open={dispute.open}
                onOpenChange={(o) => setDispute((p) => ({ ...p, open: o }))}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sanggah Serah Terima</DialogTitle>
                        <DialogDescription>
                            Jelaskan alasan sanggahan Anda.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label>Catatan</Label>
                        <Textarea
                            rows={4}
                            value={dispute.note}
                            onChange={(e) =>
                                setDispute((p) => ({
                                    ...p,
                                    note: e.target.value,
                                }))
                            }
                            placeholder="Contoh: terdapat kerusakan yang belum dicatat"
                        />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>
                                Tulis alasan secara ringkas dan jelas (min. 5
                                karakter).
                            </span>
                            {disputeRule.length < 5 ? (
                                <span>{disputeRule.length}/5*</span>
                            ) : null}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setDispute((p) => ({ ...p, open: false }))
                            }
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            disabled={
                                dispute.saving ||
                                !dispute.id ||
                                !disputeRule.valid
                            }
                            onClick={async () => {
                                if (!dispute.id) return;
                                setDispute((p) => ({ ...p, saving: true }));
                                try {
                                    await new Promise<void>(
                                        (resolve, reject) => {
                                            router.post(
                                                route(
                                                    'tenant.handovers.dispute',
                                                    { handover: dispute.id },
                                                ),
                                                { note: dispute.note },
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        setDispute({
                                                            open: false,
                                                            id: undefined,
                                                            note: '',
                                                            saving: false,
                                                        });
                                                        setHandoverDialog({
                                                            open: false,
                                                            data: null,
                                                        });
                                                        router.reload({
                                                            only: ['contract'],
                                                        });
                                                        void loadHandovers();
                                                        resolve();
                                                    },
                                                    onError: () => {
                                                        setDispute((p) => ({
                                                            ...p,
                                                            saving: false,
                                                        }));
                                                        reject(
                                                            new Error('Failed'),
                                                        );
                                                    },
                                                    onFinish: () => {
                                                        // no-op
                                                    },
                                                },
                                            );
                                        },
                                    );
                                } catch {
                                    setDispute((p) => ({
                                        ...p,
                                        saving: false,
                                    }));
                                }
                            }}
                        >
                            {dispute.saving ? 'Mengirim…' : 'Kirim Sanggahan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthLayout>
    );
}
