import React from 'react';

import AttachmentPreviewDialog from '@/components/attachment-preview';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatDate, formatIDR } from '@/lib/format';

type Target = { id: string } | null;

type PaymentDetailData = {
    payment: {
        id: string;
        method: string;
        status: string;
        amount_cents: number;
        paid_at?: string | null;
        reference?: string | null;
        provider?: string | null;
        note?: string | null;
        recorded_by?: string | null;
        attachment?: string | null;
        attachment_name?: string | null;
        attachment_uploaded_at?: string | null;
        pre_outstanding_cents?: number | null;
    };
    invoice: {
        id: string;
        number: string;
        amount_cents: number;
        due_date?: string | null;
        status: string;
        paid_at?: string | null;
    } | null;
    tenant: {
        id: string;
        name: string;
        email?: string | null;
        phone?: string | null;
    } | null;
    room: { id: string; number?: string | null; name?: string | null } | null;
};

function usePaymentDetailLoader(target: Target) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<PaymentDetailData | null>(null);

    React.useEffect(() => {
        const controller = new AbortController();
        async function load() {
            if (!target) return;
            setLoading(true);
            setData(null);
            try {
                const res = await fetch(
                    route('management.payments.show', target.id),
                    {
                        headers: { Accept: 'application/json' },
                        signal: controller.signal,
                    },
                );
                if (!res.ok) throw new Error('Gagal memuat detail pembayaran');
                const json = (await res.json()) as PaymentDetailData;
                setData(json);
            } catch {
                // ignore
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        load();
        return () => controller.abort();
    }, [target]);

    return { loading, data } as const;
}

export default function PaymentDetailDialog({
    target,
    onClose,
}: {
    target: Target;
    onClose: () => void;
}) {
    const open = !!target;
    const { loading, data } = usePaymentDetailLoader(target);
    const [previewOpen, setPreviewOpen] = React.useState(false);

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Detail Pembayaran
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Ringkasan pembayaran & faktur
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {loading || !data ? (
                        <div className="h-48 animate-pulse rounded-md border"></div>
                    ) : (
                        <PaymentDetailBody
                            data={data}
                            previewOpen={previewOpen}
                            setPreviewOpen={setPreviewOpen}
                        />
                    )}
                </div>
                <DialogFooter>
                    {data?.payment?.attachment ? (
                        <Button
                            type="button"
                            onClick={() => setPreviewOpen(true)}
                        >
                            Lihat Lampiran
                        </Button>
                    ) : null}
                    <Button type="button" variant="outline" onClick={onClose}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PaymentDetailBody({
    data,
    previewOpen,
    setPreviewOpen,
}: {
    data: PaymentDetailData;
    previewOpen: boolean;
    setPreviewOpen: (v: boolean) => void;
}) {
    const p = data.payment;
    const inv = data.invoice;
    const tenant = data.tenant;
    const room = data.room;

    const attachmentUrl = React.useMemo(() => {
        return route('management.payments.attachment', p.id);
    }, [p.id]);

    return (
        <div className="space-y-3 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Info Pembayaran
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-y-1">
                        <Label>Metode</Label>
                        <div>{p.method}</div>
                        <Label>Status</Label>
                        <div>{p.status}</div>
                        <Label>Jumlah</Label>
                        <div>{formatIDR(p.amount_cents)}</div>
                        <Label>Dibayar Pada</Label>
                        <div>{formatDate(p.paid_at)}</div>
                        <Label>Referensi</Label>
                        <div>{p.reference ?? '-'}</div>
                        <Label>Pencatat</Label>
                        <div>{p.recorded_by ?? '-'}</div>
                    </div>
                </div>
                <div className="rounded-lg border p-3">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Invoice
                    </div>
                    {inv ? (
                        <div className="grid grid-cols-[1fr_auto] gap-y-1">
                            <Label>Nomor</Label>
                            <div className="font-mono">{inv.number}</div>
                            <Label>Atas Nama</Label>
                            <div>{tenant?.name ?? '-'}</div>
                            <Label>Kamar</Label>
                            <div>
                                {room ? (
                                    <span>
                                        {room.number || '-'}{' '}
                                        {room.name ? `— ${room.name}` : ''}
                                    </span>
                                ) : (
                                    '-'
                                )}
                            </div>
                            <Label>Jatuh Tempo</Label>
                            <div>{formatDate(inv.due_date)}</div>
                            <Label>Status</Label>
                            <div>{inv.status}</div>
                            <Label>Nilai</Label>
                            <div>{formatIDR(inv.amount_cents)}</div>
                        </div>
                    ) : (
                        <div className="text-muted-foreground">
                            Tidak terkait invoice
                        </div>
                    )}
                </div>
            </div>
            {/* Review moved to a dedicated dialog */}
            <AttachmentPreviewDialog
                url={attachmentUrl}
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                title="Lampiran Pembayaran"
                description="Pratinjau bukti pembayaran."
                details={[
                    {
                        label: 'Nominal Pembayaran',
                        value: formatIDR(p.amount_cents),
                    },
                    { label: 'Nama Penyewa', value: tenant?.name || '-' },
                    { label: 'Nomor Invoice', value: inv?.number || '-' },
                ]}
            />
        </div>
    );
}
