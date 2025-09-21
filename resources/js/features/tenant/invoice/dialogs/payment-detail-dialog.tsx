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
import { createAbort, getJson } from '@/lib/api';
import { formatDate, formatIDR } from '@/lib/format';

type TenantPaymentShowDTO = {
    payment: {
        id: string;
        method: string;
        status: string;
        amount_cents: number;
        paid_at?: string | null;
        reference?: string | null;
        note?: string | null;
        attachments?: string[];
        attachment?: string | null;
        receiver_bank?: string | null;
        receiver_account?: string | null;
        receiver_holder?: string | null;
        review_by?: string | null;
        review_at?: string | null;
        reject_reason?: string | null;
    };
    invoice?: { number: string; amount_cents: number } | null;
};

function useTenantPayment(target: { id: string } | null) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<TenantPaymentShowDTO | null>(null);
    React.useEffect(() => {
        const ctrl = createAbort();
        (async () => {
            if (!target) return;
            setLoading(true);
            try {
                const json = await getJson<TenantPaymentShowDTO>(
                    route('tenant.invoices.payments.show', target.id),
                    { signal: ctrl.signal },
                );
                if (!ctrl.signal.aborted) setData(json);
            } finally {
                if (!ctrl.signal.aborted) setLoading(false);
            }
        })();
        return () => ctrl.abort();
    }, [target]);
    return { loading, data } as const;
}

export default function TenantPaymentDetailDialog({
    target,
    onClose,
}: {
    target: { id: string } | null;
    onClose: () => void;
}) {
    const open = !!target;
    const { loading, data } = useTenantPayment(target);
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const attachmentUrls = React.useMemo(() => {
        const count = Array.isArray(data?.payment?.attachments)
            ? data!.payment!.attachments!.length
            : data?.payment?.attachment
              ? 1
              : 0;
        return target
            ? Array.from(
                  { length: count },
                  (_, i) =>
                      `${route('tenant.invoices.payments.attachment', target.id)}?i=${i}`,
              )
            : [];
    }, [data, target]);

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Detail Pembayaran</DialogTitle>
                    <DialogDescription className="text-xs">
                        Ringkasan pembayaran dan hasil review
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                    {loading || !data ? (
                        <div className="h-40 animate-pulse rounded-md border" />
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border p-3">
                                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Info Pembayaran
                                </div>
                                <div className="grid grid-cols-[1fr_auto] gap-y-1">
                                    <Label>Metode</Label>
                                    <div>{data.payment.method}</div>
                                    <Label>Status</Label>
                                    <div>{data.payment.status}</div>
                                    <Label>Jumlah</Label>
                                    <div>{formatIDR(data.payment.amount_cents)}</div>
                                    <Label>Dibayar Pada</Label>
                                    <div>{formatDate(data.payment.paid_at, true)}</div>
                                    <Label>Referensi</Label>
                                    <div>{data.payment.reference || '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-lg border p-3">
                                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Rekening Penerima
                                </div>
                                <div className="grid grid-cols-[1fr_auto] gap-y-1">
                                    <Label>Bank</Label>
                                    <div>{data.payment.receiver_bank || '-'}</div>
                                    <Label>No. Rekening</Label>
                                    <div className="font-mono">
                                        {data.payment.receiver_account || '-'}
                                    </div>
                                    <Label>Nama</Label>
                                    <div>{data.payment.receiver_holder || '-'}</div>
                                </div>
                            </div>
                            {(data.payment.reject_reason || data.payment.review_by || data.payment.note) && (
                                <div className="sm:col-span-2 rounded-lg border p-3">
                                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Hasil Review
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        {data.payment.reject_reason ? (
                                            <div className="text-destructive">
                                                Ditolak: {data.payment.reject_reason}
                                            </div>
                                        ) : null}
                                        {data.payment.note ? (
                                            <div className="whitespace-pre-wrap break-words text-muted-foreground">
                                                {data.payment.review_by ? 'Catatan Admin:' : 'Catatan:'}{' '}
                                                {data.payment.note}
                                            </div>
                                        ) : null}
                                        {data.payment.review_by || data.payment.review_at ? (
                                            <div className="text-[12px] text-muted-foreground">
                                                {data.payment.review_by ? `Diproses oleh ${data.payment.review_by}` : ''}
                                                {data.payment.review_at
                                                    ? `${data.payment.review_by ? ' • ' : ''}${formatDate(data.payment.review_at, true)}`
                                                    : ''}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    {attachmentUrls.length > 0 ? (
                        <Button type="button" onClick={() => setPreviewOpen(true)}>
                            Lihat Bukti
                        </Button>
                    ) : null}
                    <Button variant="outline" onClick={onClose}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
            <AttachmentPreviewDialog
                url={attachmentUrls[0] || ''}
                urls={attachmentUrls}
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                title="Lampiran Pembayaran"
                description="Pratinjau bukti pembayaran."
            />
        </Dialog>
    );
}
