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
import { formatDate, formatIDR } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import type { InvoiceDetailData, InvoiceDetailTarget } from './types';

function useInvoiceDetailLoader(target: InvoiceDetailTarget) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<null | InvoiceDetailData>(null);

  React.useEffect(() => {
    let abort = false;
    async function load() {
      if (!target) return;
      setLoading(true);
      try {
        const res = await fetch(route('management.invoices.show', target.id), {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (!res.ok) throw new Error('Gagal memuat detail invoice');
        const json = await res.json();
        if (!abort) setData(json);
      } catch (e) {
        // noop
      } finally {
        if (!abort) setLoading(false);
      }
    }
    load();
    return () => {
      abort = true;
    };
  }, [target?.id]);

  return { loading, data } as const;
}

export default function InvoiceDetailDialog({ target, onClose }: { target: InvoiceDetailTarget; onClose: () => void }) {
  const open = !!target;
  const { loading, data } = useInvoiceDetailLoader(target);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Invoice {target?.number ?? ''}
            {data?.invoice?.status ? (
              <Badge variant="secondary" className="ml-1">{data.invoice.status}</Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription className="text-xs">Ringkasan tagihan &amp; item.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {loading || !data ? (
            <div className="text-sm text-muted-foreground">Memuat…</div>
          ) : (
            <InvoiceDetailBody data={data} />
          )}
        </div>
        <DialogFooter>
          {target ? (
            <a href={`${route('management.invoices.print', target.id)}?auto=1`} target="_blank" rel="noreferrer">
              <Button variant="secondary">Cetak PDF</Button>
            </a>
          ) : null}
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDetailBody({ data }: { data: InvoiceDetailData }) {
  const inv = data.invoice;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-3">
        <div className="text-sm">
          <div className="text-muted-foreground text-xs">Total Tagihan</div>
          <div className="font-semibold">{formatIDR(inv.amount_cents)}</div>
        </div>
        <div className="text-sm">
          <div className="text-muted-foreground text-xs">Status</div>
          <div className="font-semibold">{inv.status}</div>
        </div>
        <div className="text-sm">
          <div className="text-muted-foreground text-xs">Jatuh Tempo</div>
          <div className="font-semibold">{formatDate(inv.due_date ?? null)}</div>
        </div>
      </div>
      <Separator />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-muted-foreground">Penyewa</Label>
          <div className="text-sm font-semibold">{data.tenant?.name ?? '—'}</div>
          {(data.tenant?.email || data.tenant?.phone) ? (
            <div className="text-xs text-muted-foreground">
              {[data.tenant?.email, data.tenant?.phone].filter(Boolean).join(' • ')}
            </div>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground">Kontrak &amp; Kamar</Label>
          <div className="text-sm">Kamar {data.room?.number ?? '—'}</div>
          {(data.contract?.start_date || data.contract?.end_date) ? (
            <div className="text-xs text-muted-foreground">
              {formatDate(data.contract?.start_date ?? null)} – {formatDate(data.contract?.end_date ?? null)}
            </div>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Item</th>
              <th className="w-[100px] px-3 py-2 text-right">Qty</th>
              <th className="w-[160px] px-3 py-2 text-right">Harga</th>
              <th className="w-[160px] px-3 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it, idx) => {
              const meta = (it.meta ?? {}) as Record<string, any>;
              const rawLabel = it.label ?? '';
              const baseLabel = rawLabel.includes('×') ? rawLabel.split('×')[0].trim() : rawLabel;
              const displayLabel = baseLabel
                .replace(/^Sewa\s+1\s+(bulan|hari|minggu)\b/i, 'Sewa')
                .replace(/^Prorata\s+awal\b/i, 'Prorata');
              const dateStart = typeof meta.date_start === 'string' ? meta.date_start : null;
              const dateEndInclusive = typeof meta.date_end === 'string' ? meta.date_end : null;
              const endExclusive = dateEndInclusive ? new Date(dateEndInclusive) : null;
              if (endExclusive) endExclusive.setDate(endExclusive.getDate() + 1);
              const daysFromRange = dateStart && endExclusive ? Math.max(1, Math.round((endExclusive.getTime() - new Date(dateStart).getTime()) / (24 * 3600 * 1000))) : null;
              const qty = (typeof meta.qty === 'number' ? meta.qty : daysFromRange ?? 1) as number;
              const totalDays = typeof meta.days === 'number' ? (meta.days as number) : null;
              const freeDays = typeof meta.free_days === 'number' ? (meta.free_days as number) : null;
              const unitPrice = (typeof meta.unit_price_cents === 'number' ? meta.unit_price_cents : Math.round(it.amount_cents / Math.max(1, qty))) as number;
              const desc = (meta.description ?? meta.desc ?? meta.note ?? '') as string;
              const isProrata = (it.code ?? '').toUpperCase() === 'PRORATA' || /prorata/i.test(displayLabel);
              return (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2 align-top">
                    <div className="font-medium">{displayLabel}</div>
                    {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
                    {isProrata && (dateStart || endExclusive) ? (
                      <div className="mt-1 text-xs text-muted-foreground">{formatDate(dateStart ?? null)} – {formatDate(endExclusive ?? null)}</div>
                    ) : null}
                    {isProrata && freeDays != null && freeDays > 0 && totalDays != null ? (
                      <div className="mt-0.5 text-xs text-muted-foreground">{`Total ${totalDays} hari; gratis ${Math.min(freeDays, totalDays)} hari; ditagih ${qty} hari.`}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 align-top text-right">{qty}</td>
                  <td className="px-3 py-2 align-top text-right">{formatIDR(unitPrice)}</td>
                  <td className="px-3 py-2 align-top text-right">{formatIDR(it.amount_cents)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/50">
              <td className="px-3 py-2 text-right font-semibold" colSpan={3}>
                Total
              </td>
              <td className="px-3 py-2 text-right font-semibold">{formatIDR(inv.amount_cents)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
