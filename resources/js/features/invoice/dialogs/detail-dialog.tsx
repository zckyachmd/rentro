import React from 'react';

import { Button } from '@/components/ui/button';
import { CopyInline } from '@/components/ui/copy-inline';
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
import { createAbort, getJson } from '@/lib/api';
import { formatDate, formatIDR } from '@/lib/format';
import type {
    ManagementInvoiceDetailDTO as InvoiceDetailDTO,
    ManagementInvoiceDetailTarget as InvoiceDetailTarget,
} from '@/types/management';

// types moved to pages/types/management/invoice

function useInvoiceDetailLoader(target: InvoiceDetailTarget) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<null | InvoiceDetailDTO>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const controller = createAbort();
        (async () => {
            if (!target) return;
            setLoading(true);
            setData(null);
            setError(null);
            try {
                const json = await getJson<InvoiceDetailDTO>(
                    route('management.invoices.show', target.id),
                    { signal: controller.signal },
                );
                setData(json);
            } catch (e) {
                setError(
                    e instanceof Error
                        ? e.message || 'Gagal memuat invoice'
                        : 'Gagal memuat invoice',
                );
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        })();
        return () => controller.abort();
    }, [target]);

    return { loading, data, error } as const;
}

export default function InvoiceDetailDialog({
    target,
    onClose,
}: {
    target: InvoiceDetailTarget;
    onClose: () => void;
}) {
    const open = !!target;
    const { loading, data, error } = useInvoiceDetailLoader(target);

    return (
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
                    {loading ? (
                        <div className="h-48 animate-pulse rounded-md border" />
                    ) : error ? (
                        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    ) : data ? (
                        <InvoiceDetailBody data={data} />
                    ) : (
                        <div className="h-20" />
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function InvoiceDetailBody({ data }: { data: InvoiceDetailDTO }) {
    const inv = data.invoice;
    const c = data.contract;
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
                        <div className="inline-flex items-center gap-1 font-mono">
                            <span>{inv.number}</span>
                            <CopyInline
                                value={inv.number}
                                variant="icon"
                                size="xs"
                                title="Salin nomor invoice"
                                aria-label="Salin nomor invoice"
                            />
                        </div>
                        <Label>No. Kontrak</Label>
                        {(() => {
                            const display =
                                c?.number && c.number.trim() !== ''
                                    ? c.number
                                    : c?.id
                                      ? `#${c.id}`
                                      : '-';
                            const copyVal =
                                c?.number && c.number.trim() !== ''
                                    ? c.number
                                    : c?.id
                                      ? String(c.id)
                                      : '';
                            return (
                                <div className="inline-flex items-center gap-1 font-mono">
                                    <span>{display}</span>
                                    {copyVal ? (
                                        <CopyInline
                                            value={copyVal}
                                            variant="icon"
                                            size="xs"
                                            title="Salin nomor kontrak"
                                            aria-label="Salin nomor kontrak"
                                        />
                                    ) : null}
                                </div>
                            );
                        })()}
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
                        {typeof inv.release_day === 'number' &&
                            (c?.billing_period || '').toLowerCase() ===
                                'monthly' && (
                                <>
                                    <Label>Rilis Tagihan</Label>
                                    <div>{`Setiap tanggal ${inv.release_day}`}</div>
                                </>
                            )}
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
                    {inv.items.map((it, idx) => {
                        const unit =
                            (it.meta?.unit as string | undefined) || '';
                        const qty = Number(it.meta?.qty ?? 0) || undefined;
                        const unitPriceCents = Number(
                            it.meta?.unit_price_cents ?? 0,
                        );
                        const hasBreakdown = Boolean(qty && unitPriceCents > 0);
                        return (
                            <div
                                key={idx}
                                className="flex items-center justify-between"
                            >
                                <div>
                                    <div className="font-medium">
                                        {it.label}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {it.code}
                                    </div>
                                    {hasBreakdown && (
                                        <div className="text-xs text-muted-foreground">
                                            {`${formatIDR(unitPriceCents)} × ${qty} ${unit}`}
                                        </div>
                                    )}
                                </div>
                                <div className="font-medium">
                                    {formatIDR(it.amount_cents)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
