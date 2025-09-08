import React from 'react';

import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';
import { formatDate, formatIDR } from '@/lib/format';
import { variantForPaymentStatus } from '@/lib/status';

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
                        credentials: 'same-origin',
                        signal: controller.signal,
                    },
                );
                if (!res.ok) throw new Error('Gagal memuat detail pembayaran');
                const json = (await res.json()) as PaymentDetailData;
                setData(json);
            } catch (err) {
                console.error(err);
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
    onRequestPreview,
}: {
    target: Target;
    onClose: () => void;
    onRequestPreview?: (req: {
        url: string;
        title?: string;
        description?: string;
        details?: { label: string; value: string }[];
    }) => void;
}) {
    const open = !!target;
    const { loading, data } = usePaymentDetailLoader(target);

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Detail Pembayaran
                        {data?.payment?.status ? (
                            <Badge
                                variant={variantForPaymentStatus(
                                    data.payment.status,
                                )}
                            >
                                {data.payment.status}
                            </Badge>
                        ) : null}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Ringkasan pembayaran dan keterkaitan invoice.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {loading || !data ? (
                        <div className="text-sm text-muted-foreground">
                            Memuat…
                        </div>
                    ) : (
                        <PaymentDetailBody data={data} />
                    )}
                </div>

                <DialogFooter>
                    {data?.payment?.attachment ? (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                onClose();
                                if (onRequestPreview && data?.payment?.id) {
                                    onRequestPreview({
                                        url: route(
                                            'management.payments.attachment',
                                            data.payment.id,
                                        ),
                                        title: 'Bukti Pembayaran',
                                        description: `Lampiran bukti pembayaran untuk invoice ${data.invoice?.number ?? '-'}`,
                                    });
                                }
                            }}
                        >
                            Lihat Bukti Pembayaran
                        </Button>
                    ) : null}
                    {data?.payment?.id ? (
                        <a
                            href={route(
                                'management.payments.print',
                                data.payment.id,
                            )}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Button type="button" variant="secondary">
                                Cetak Kwitansi
                            </Button>
                        </a>
                    ) : null}
                    <Button type="button" variant="outline" onClick={onClose}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
            {/* Preview dialog dipindahkan ke parent (index) agar dialog ini dapat ditutup saat pratinjau */}
        </Dialog>
    );
}

function PaymentDetailBody({ data }: { data: PaymentDetailData }) {
    const p = data.payment;
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-4">
                <div className="text-sm">
                    <div className="text-xs text-muted-foreground">Nominal</div>
                    <div className="font-semibold">
                        {formatIDR(p.amount_cents)}
                    </div>
                </div>
                <div className="text-sm">
                    <div className="text-xs text-muted-foreground">Metode</div>
                    <div className="font-semibold">{p.method}</div>
                </div>
                <div className="text-sm">
                    <div className="text-xs text-muted-foreground">
                        Tanggal Bayar
                    </div>
                    <div className="font-semibold">
                        {formatDate(p.paid_at ?? null)}
                    </div>
                </div>
                <div className="text-sm">
                    <div className="text-xs text-muted-foreground">
                        Dicatat oleh
                    </div>
                    <div className="font-semibold">{p.recorded_by || '—'}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Label className="text-muted-foreground">Invoice</Label>
                    <div className="font-mono text-sm">
                        {data.invoice?.number ?? '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {formatIDR(data.invoice?.amount_cents ?? 0)}
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-muted-foreground">Penyewa</Label>
                    <div className="text-sm font-semibold">
                        {data.tenant?.name ?? '—'}
                    </div>
                    {data.tenant?.email || data.tenant?.phone ? (
                        <div className="text-xs text-muted-foreground">
                            {[data.tenant?.email, data.tenant?.phone]
                                .filter(Boolean)
                                .join(' • ')}
                        </div>
                    ) : null}
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="text-sm">
                    <div className="text-xs text-muted-foreground">
                        Referensi
                    </div>
                    <div className="font-medium">{p.reference || '—'}</div>
                </div>
                <div className="text-sm">
                    <div className="text-xs text-muted-foreground">
                        Provider/Bank
                    </div>
                    <div className="font-medium">
                        {p.provider || (p.method === 'Cash' ? 'Kasir' : '—')}
                    </div>
                </div>
                <div className="text-sm sm:col-span-2">
                    <div className="text-xs text-muted-foreground">Catatan</div>
                    <div className="font-medium">{p.note || '—'}</div>
                </div>
            </div>

            <div className="rounded-md border bg-muted/30 p-3 text-xs">
                <div className="flex items-center justify-between">
                    <div>Jumlah sebelum pembayaran ini</div>
                    <div className="font-semibold">
                        {formatIDR(p.pre_outstanding_cents || 0)}
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div>Jumlah dibayar</div>
                    <div className="font-semibold">
                        {formatIDR(p.amount_cents)}
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div>Sisa setelah pembayaran</div>
                    <div className="font-semibold">
                        {formatIDR(
                            Math.max(
                                0,
                                (p.pre_outstanding_cents || 0) - p.amount_cents,
                            ),
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
