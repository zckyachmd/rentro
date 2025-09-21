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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import TenantPaymentDetailDialog from '@/features/tenant/invoice/dialogs/payment-detail-dialog';
// icons removed for simpler UI
import { createAbort, getJson } from '@/lib/api';
import { formatDate, formatIDR } from '@/lib/format';
import { variantForInvoiceStatus, variantForPaymentStatus } from '@/lib/status';
import type { TenantInvoiceDetailDTO } from '@/types/tenant';

function useInvoiceLoader(target: { id: string } | null) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<TenantInvoiceDetailDTO | null>(null);
    React.useEffect(() => {
        const controller = createAbort();
        async function load() {
            if (!target) return;
            setLoading(true);
            try {
                const json = await getJson<TenantInvoiceDetailDTO>(
                    route('tenant.invoices.show', target.id),
                    { signal: controller.signal },
                );
                if (!controller.signal.aborted) setData(json);
            } catch (e) {
                void e; // no-op
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        load();
        return () => controller.abort();
    }, [target]);
    return { loading, data } as const;
}

export default function TenantInvoiceDetailDialog({
    target,
    onClose,
    onPay,
}: {
    target: { id: string } | null;
    onClose: () => void;
    onPay?: (id: string, number?: string) => void;
}) {
    const open = !!target;
    const { loading, data } = useInvoiceLoader(target);
    const [paymentDetail, setPaymentDetail] = React.useState<{
        id: string;
    } | null>(null);
    return (
        <>
            <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Detail Invoice</DialogTitle>
                        <DialogDescription className="text-xs">
                            Ringkasan tagihan
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {loading || !data ? (
                            <div className="h-40 animate-pulse rounded-md border" />
                        ) : (
                            <div className="space-y-3 text-sm">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-lg border p-3">
                                        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Info Invoice
                                        </div>
                                        <div className="grid grid-cols-[1fr_auto] gap-y-1">
                                            <Label>Nomor</Label>
                                            <div className="font-mono">
                                                {data.invoice.number}
                                            </div>
                                            <Label>Jatuh Tempo</Label>
                                            <div>
                                                {formatDate(
                                                    data.invoice.due_date,
                                                )}
                                            </div>
                                            <Label>Status</Label>
                                            <div>
                                                <Badge
                                                    variant={variantForInvoiceStatus(
                                                        data.invoice.status,
                                                    )}
                                                >
                                                    {data.invoice.status}
                                                </Badge>
                                            </div>
                                            {String(
                                                data.invoice.status || '',
                                            ).toLowerCase() === 'cancelled' ? (
                                                <div className="col-span-2 mt-1 text-[11px] text-muted-foreground">
                                                    Tagihan dibatalkan.
                                                    Pembayaran baru tidak
                                                    tersedia, riwayat pembayaran
                                                    tetap tercatat.
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Nilai
                                        </div>
                                        <div className="grid grid-cols-[1fr_auto] gap-y-1">
                                            <Label>Total</Label>
                                            <div>
                                                {formatIDR(
                                                    data.invoice.amount_cents,
                                                )}
                                            </div>
                                            <Label>Sisa</Label>
                                            <div>
                                                {formatIDR(
                                                    data.payment_summary
                                                        ?.outstanding ?? 0,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Rincian item */}
                                    {Array.isArray(data.invoice.items) &&
                                    data.invoice.items.length > 0 ? (
                                        <div className="rounded-lg border p-3 sm:col-span-2">
                                            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Rincian Item
                                            </div>
                                            <div className="space-y-1">
                                                {data.invoice.items.map(
                                                    (it, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between"
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="truncate font-medium">
                                                                    {it.label}
                                                                </div>
                                                            </div>
                                                            <div className="shrink-0 font-medium">
                                                                {formatIDR(
                                                                    it.amount_cents,
                                                                )}
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                    {Array.isArray(data.payments) &&
                                    data.payments.length > 0 ? (
                                        <div className="rounded-lg border p-3 sm:col-span-2">
                                            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Riwayat Pembayaran
                                            </div>
                                            <ScrollArea className="max-h-[280px] rounded-md border border-dashed bg-background/40">
                                                <div className="space-y-2 p-2 sm:p-3">
                                                    {(
                                                        data.payments as NonNullable<
                                                            TenantInvoiceDetailDTO['payments']
                                                        >
                                                    ).map((pmt) => (
                                                        <button
                                                            key={pmt.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setPaymentDetail({
                                                                    id: pmt.id,
                                                                })
                                                            }
                                                            className="flex w-full items-start justify-between gap-3 text-left hover:bg-muted/30"
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="text-xs text-muted-foreground">
                                                                    {pmt.method} •{' '}
                                                                    {formatDate(
                                                                        pmt.paid_at,
                                                                        true,
                                                                    )}
                                                                </div>
                                                                {pmt.reference ? (
                                                                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                                        Referensi: {pmt.reference}
                                                                    </div>
                                                                ) : null}
                                                                {pmt.receiver_bank ? (
                                                                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                                        Rek. Penerima: {pmt.receiver_bank}
                                                                        {pmt.receiver_account
                                                                            ? ` — ${pmt.receiver_account}`
                                                                            : ''}
                                                                        {pmt.receiver_holder
                                                                            ? ` (${pmt.receiver_holder})`
                                                                            : ''}
                                                                    </div>
                                                                ) : null}
                                                                {pmt.reject_reason ? (
                                                                    <div className="mt-0.5 text-[11px] text-destructive">
                                                                        Ditolak: {pmt.reject_reason}
                                                                    </div>
                                                                ) : null}
                                                                {pmt.note ? (
                                                                    <div className="mt-0.5 whitespace-pre-wrap break-words text-[11px] text-muted-foreground">
                                                                        {pmt.review_by
                                                                            ? 'Catatan Admin:'
                                                                            : 'Catatan:'}{' '}
                                                                        {pmt.note}
                                                                    </div>
                                                                ) : null}
                                                                {pmt.review_by || pmt.review_at ? (
                                                                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                                        {pmt.review_by
                                                                            ? `Diproses oleh ${pmt.review_by}`
                                                                            : ''}
                                                                        {pmt.review_at
                                                                            ? `${pmt.review_by ? ' • ' : ''}${formatDate(pmt.review_at, true)}`
                                                                            : ''}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                            <div className="shrink-0 text-right">
                                                                <div className="mb-1 font-medium">
                                                                    {formatIDR(
                                                                        pmt.amount_cents,
                                                                    )}
                                                                </div>
                                                                <Badge
                                                                    variant={variantForPaymentStatus(
                                                                        pmt.status,
                                                                    )}
                                                                >
                                                                    {pmt.status}
                                                                </Badge>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                                <ScrollBar orientation="vertical" />
                                            </ScrollArea>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        {data?.payment_summary?.outstanding &&
                        data.payment_summary.outstanding > 0 &&
                        String(data?.invoice?.status || '').toLowerCase() !==
                            'cancelled' ? (
                            <Button
                                type="button"
                                onClick={() => {
                                    if (target?.id)
                                        onPay?.(
                                            target.id,
                                            data?.invoice?.number,
                                        );
                                    onClose();
                                }}
                            >
                                {(() => {
                                    const last = (data.payments || [])[0];
                                    return last && last.status === 'Rejected'
                                        ? 'Bayar Ulang'
                                        : 'Bayar';
                                })()}
                            </Button>
                        ) : null}
                        <Button variant="outline" onClick={onClose}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <TenantPaymentDetailDialog
                target={paymentDetail}
                onClose={() => setPaymentDetail(null)}
            />
        </>
    );
}
