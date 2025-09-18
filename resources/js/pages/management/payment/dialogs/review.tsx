import React from 'react';

import AttachmentPreviewDialog from '@/components/attachment-preview';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useLengthRule } from '@/hooks/use-length-rule';
import { ensureXsrfToken } from '@/hooks/use-confirm-password';
import { formatIDR } from '@/lib/format';
import type {
    ManagementPaymentShowDTO as PaymentShow,
    ManagementPaymentDetailTarget as Target,
} from '@/types/management';

// types moved to pages/types

function usePayment(target: Target) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<PaymentShow | null>(null);
    React.useEffect(() => {
        const ctrl = new AbortController();
        (async () => {
            if (!target) return;
            setLoading(true);
            try {
                const res = await fetch(
                    route('management.payments.show', target.id),
                    {
                        headers: { Accept: 'application/json' },
                        signal: ctrl.signal,
                    },
                );
                if (!res.ok) return;
                const json = (await res.json()) as PaymentShow;
                if (!ctrl.signal.aborted) setData(json);
            } finally {
                if (!ctrl.signal.aborted) setLoading(false);
            }
        })();
        return () => ctrl.abort();
    }, [target]);
    return { loading, data } as const;
}

export default function PaymentReviewDialog({
    target,
    onClose,
}: {
    target: Target;
    onClose: () => void;
}) {
    const open = !!target;
    const { loading, data } = usePayment(target);
    const [ack, setAck] = React.useState(false);
    const [note, setNote] = React.useState('');
    const [decision, setDecision] = React.useState<'approve' | 'reject' | null>(
        'approve',
    );

    const MIN_NOTE = 20;
    const noteRule = useLengthRule(note, {
        min: MIN_NOTE,
        required: decision === 'reject',
        trim: true,
    });
    const showCounter = noteRule.length <= MIN_NOTE;

    // No additional attachment from admin during review
    const toLocal = React.useCallback((d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }, []);
    const [paidAt, setPaidAt] = React.useState<string>(() =>
        toLocal(new Date()),
    );

    React.useEffect(() => {
        if (data?.payment?.paid_at) setPaidAt(data.payment.paid_at);
    }, [data?.payment?.paid_at]);

    const [previewOpen, setPreviewOpen] = React.useState(false);

    const submit = React.useCallback(async () => {
        if (!target) return;
        const token = await ensureXsrfToken();
        if (!token) return;
        if (!decision) {
            alert('Pilih keputusan: Terima atau Tolak.');
            return;
        }
        if (!ack) {
            alert('Centang pernyataan kebenaran data sebelum submit.');
            return;
        }
        if (decision === 'reject') {
            if (!noteRule.meetsMin) {
                alert(`Alasan penolakan minimal ${MIN_NOTE} karakter.`);
                return;
            }
        } else {
            if (noteRule.length > 0 && !noteRule.meetsMin) {
                alert(`Catatan minimal ${MIN_NOTE} karakter jika diisi.`);
                return;
            }
        }
        const fd = new FormData();
        if (decision === 'approve') {
            fd.append('ack', 'on');
            if (noteRule.meetsMin) fd.append('note', note);
        } else {
            fd.append('reason', note);
        }
        if (paidAt) fd.append('paid_at', paidAt);
        const res = await fetch(route('management.payments.ack', target.id), {
            method: 'POST',
            headers: { 'X-XSRF-TOKEN': token, Accept: 'application/json' },
            credentials: 'same-origin',
            body: fd,
        });
        if (res.ok) window.location.reload();
    }, [target, ack, note, paidAt, decision, noteRule.length, noteRule.meetsMin]);

    const p = data?.payment;
    const inv = data?.invoice;
    const tenant = data?.tenant;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Review Pembayaran Transfer</DialogTitle>
                    <DialogDescription className="text-xs">
                        Pilih hasil review dan pastikan kebenaran data sebelum
                        submit.
                    </DialogDescription>
                </DialogHeader>
                {loading || !p ? (
                    <div className="h-40 animate-pulse rounded-md border" />
                ) : (
                    <ScrollArea className="max-h-[70vh] pr-2">
                        <div className="space-y-4 pb-2 text-sm">
                            <div className="rounded-lg border p-3">
                                <div className="mb-3 flex items-start justify-between gap-2">
                                    <div>
                                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Ringkasan
                                        </div>
                                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                                            Periksa data sebelum
                                            konfirmasi/tolak.
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/80">
                                        {p.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-y-1 sm:grid-cols-2">
                                    <div className="text-muted-foreground">
                                        Invoice
                                    </div>
                                    <div className="font-mono">
                                        {inv?.number ?? '-'}
                                    </div>
                                    <div className="text-muted-foreground">
                                        Penyewa
                                    </div>
                                    <div>{tenant?.name ?? '-'}</div>
                                    <div className="text-muted-foreground">
                                        Nominal
                                    </div>
                                    <div>{formatIDR(p.amount_cents)}</div>
                                    <div className="text-muted-foreground">
                                        Metode
                                    </div>
                                    <div>{p.method}</div>
                                </div>
                            </div>

                            <div className="rounded-lg border p-3">
                                <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Tinjau
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label>Keputusan</Label>
                                        <div className="flex items-center gap-3 text-sm">
                                            <label className="inline-flex cursor-pointer items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="decision"
                                                    value="approve"
                                                    className="h-4 w-4"
                                                    checked={
                                                        decision === 'approve'
                                                    }
                                                    onChange={() =>
                                                        setDecision('approve')
                                                    }
                                                />
                                                <span>Terima</span>
                                            </label>
                                            <label className="inline-flex cursor-pointer items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="decision"
                                                    value="reject"
                                                    className="h-4 w-4"
                                                    checked={
                                                        decision === 'reject'
                                                    }
                                                    onChange={() =>
                                                        setDecision('reject')
                                                    }
                                                />
                                                <span>Tolak</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>
                                            {decision === 'reject'
                                                ? 'Alasan penolakan'
                                                : 'Catatan (opsional)'}
                                        </Label>
                                        <Textarea
                                            rows={3}
                                            value={note}
                                            onChange={(e) =>
                                                setNote(e.target.value)
                                            }
                                            placeholder={
                                                decision === 'reject'
                                                    ? 'Wajib diisi saat menolak'
                                                    : 'Opsional: catatan internal konfirmasi'
                                            }
                                        />
                                        <div className="mt-1 text-right text-[11px] text-muted-foreground">
                                            {showCounter
                                                ? `${noteRule.length}/${MIN_NOTE}`
                                                : ''}
                                        </div>
                                    </div>
                                    <label
                                        htmlFor="ack"
                                        className="flex cursor-pointer items-start gap-2 text-xs sm:text-sm"
                                    >
                                        <Checkbox
                                            id="ack"
                                            checked={ack}
                                            onCheckedChange={(v) =>
                                                setAck(Boolean(v))
                                            }
                                        />
                                        <span>
                                            Saya memastikan data pada bukti
                                            pembayaran valid dan sesuai.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                )}
                <DialogFooter>
                    {p?.attachment ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPreviewOpen(true)}
                        >
                            Lihat Lampiran
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        disabled={!decision || !ack || !noteRule.valid}
                        onClick={() => {
                            submit();
                        }}
                    >
                        Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
            {p?.attachment ? (
                <AttachmentPreviewDialog
                    url={route('management.payments.attachment', p.id)}
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
            ) : null}
        </Dialog>
    );
}
