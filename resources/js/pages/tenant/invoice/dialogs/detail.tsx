import React from 'react';

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
import type {
    TenantInvoiceDetailDTO,
    TenantInvoiceDetailTarget as InvoiceDetailTarget,
} from '@/types/tenant';

import TenantInvoicePayDialog from './pay';

function useInvoiceDetailLoader(target: InvoiceDetailTarget) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<null | TenantInvoiceDetailDTO>(null);

    React.useEffect(() => {
        const controller = new AbortController();
        async function load() {
            if (!target) return;
            setLoading(true);
            setData(null);
            try {
                const res = await fetch(
                    route('tenant.invoices.show', target.id),
                    {
                        headers: { Accept: 'application/json' },
                        credentials: 'same-origin',
                        signal: controller.signal,
                    },
                );
                if (!res.ok) throw new Error('Gagal memuat detail invoice');
                const json = await res.json();
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

export default function TenantInvoiceDetailDialog({
    target,
    onClose,
}: {
    target: InvoiceDetailTarget;
    onClose: () => void;
}) {
    const open = !!target;
    const { loading, data } = useInvoiceDetailLoader(target);
    const [openPay, setOpenPay] = React.useState(false);

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Invoice {target?.number ?? ''}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Ringkasan tagihan & item.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {loading || !data ? (
                            <div className="h-48 animate-pulse rounded-md border"></div>
                        ) : (
                            <InvoiceDetailBody data={data} />
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Tutup
                        </Button>
                        {data &&
                        (data.payment_summary?.outstanding ?? 0) > 0 ? (
                            <Button
                                type="button"
                                onClick={() => {
                                    setOpenPay(true);
                                    onClose();
                                }}
                            >
                                Bayar
                            </Button>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <TenantInvoicePayDialog
                target={
                    openPay && data
                        ? { id: data.invoice.id, number: data.invoice.number }
                        : null
                }
                onClose={() => setOpenPay(false)}
            />
        </>
    );
}

function InvoiceDetailBody({ data }: { data: TenantInvoiceDetailDTO }) {
    const inv = data.invoice;
    const summary = data.payment_summary;
    return (
        <div className="space-y-3 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Info Invoice
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-y-1">
                        <Label>Nomor</Label>
                        <div className="font-mono">{inv.number}</div>
                        <Label>Periode</Label>
                        <div>
                            {(formatDate(inv.period_start) ?? '-') +
                                ' s/d ' +
                                (formatDate(inv.period_end) ?? '-')}
                        </div>
                        <Label>Jatuh Tempo</Label>
                        <div>{formatDate(inv.due_date)}</div>
                        <Label>Status</Label>
                        <div>{inv.status}</div>
                    </div>
                </div>
                <div className="rounded-lg border p-3">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Nilai & Pembayaran
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-y-1">
                        <Label>Total</Label>
                        <div>{formatIDR(inv.amount_cents)}</div>
                        <Label>Terbayar</Label>
                        <div>{formatIDR(summary?.total_paid ?? 0)}</div>
                        <Label>Sisa</Label>
                        <div>{formatIDR(summary?.outstanding ?? 0)}</div>
                    </div>
                </div>
            </div>
            <Separator />
            <div className="rounded-lg border p-3">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Item
                </div>
                <div className="space-y-2">
                    {inv.items.map((it, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between"
                        >
                            <div>
                                <div className="font-medium">{it.label}</div>
                                <div className="text-xs text-muted-foreground">
                                    {it.code}
                                </div>
                            </div>
                            <div className="font-medium">
                                {formatIDR(it.amount_cents)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
