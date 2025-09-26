import React from 'react';
import { useTranslation } from 'react-i18next';

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
import i18n from '@/lib/i18n';
import type {
    ManagementInvoiceDetailDTO as InvoiceDetailDTO,
    ManagementInvoiceDetailTarget as InvoiceDetailTarget,
} from '@/types/management';

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
                        ? e.message ||
                              i18n.t('detail.error', {
                                  ns: 'management/invoice',
                              })
                        : i18n.t('detail.error', { ns: 'management/invoice' }),
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
    const { t } = useTranslation();
    const { t: tInvoice } = useTranslation('management/invoice');

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {tInvoice('title')} {target?.number ?? ''}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        {tInvoice('detail.desc')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {loading ? (
                        <div className="h-48 animate-pulse rounded-md border" />
                    ) : error ? (
                        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
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
                        {t('common.close')}
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
    const { t } = useTranslation();
    const { t: tInvoice } = useTranslation('management/invoice');
    return (
        <div className="space-y-3 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                        {tInvoice('detail.info')}
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-y-1">
                        <Label>{t('common.number')}</Label>
                        <div className="inline-flex items-center gap-1 font-mono">
                            <span>{inv.number}</span>
                            <CopyInline
                                value={inv.number}
                                variant="icon"
                                size="xs"
                                title={t('invoice.copy_number')}
                                aria-label={t('invoice.copy_number')}
                            />
                        </div>
                        <Label>{tInvoice('detail.contract_no')}</Label>
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
                                            title={t('contract.copy_number')}
                                            aria-label={t(
                                                'contract.copy_number',
                                            )}
                                        />
                                    ) : null}
                                </div>
                            );
                        })()}
                        <Label>{t('common.period')}</Label>
                        <div>
                            {(formatDate(inv.period_start) ?? '-') +
                                t('common.period_sep') +
                                (formatDate(inv.period_end) ?? '-')}
                        </div>
                        <Label>{t('common.due_date')}</Label>
                        <div>{formatDate(inv.due_date)}</div>
                        <Label>{t('common.status')}</Label>
                        <div>
                            {t(
                                `invoice.status.${String(inv.status || '')
                                    .trim()
                                    .toLowerCase()
                                    .replace(/\s+/g, '_')}`,
                                {
                                    ns: 'enum',
                                    defaultValue: inv.status,
                                },
                            )}
                        </div>
                        {typeof inv.release_day === 'number' &&
                            (c?.billing_period || '').toLowerCase() ===
                                'monthly' && (
                                <>
                                    <Label>
                                        {tInvoice('detail.release_day')}
                                    </Label>
                                    <div>
                                        {tInvoice('detail.release_day_value', {
                                            day: inv.release_day,
                                        })}
                                    </div>
                                </>
                            )}
                    </div>
                </div>
                <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                        {tInvoice('detail.amounts')}
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-y-1">
                        <Label>{t('common.total')}</Label>
                        <div>{formatIDR(inv.amount_idr)}</div>
                        <Label>{tInvoice('detail.paid')}</Label>
                        <div>{formatIDR(summary?.total_paid ?? 0)}</div>
                        <Label>{tInvoice('detail.outstanding')}</Label>
                        <div>{formatIDR(summary?.outstanding ?? 0)}</div>
                    </div>
                </div>
            </div>
            <Separator />
            <div className="rounded-lg border p-3">
                <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                    {tInvoice('detail.items')}
                </div>
                <div className="space-y-2">
                    {inv.items.map((it, idx) => {
                        const unit =
                            (it.meta?.unit as string | undefined) || '';
                        const qty = Number(it.meta?.qty ?? 0) || undefined;
                        const unitPriceCents = Number(
                            it.meta?.unit_price_idr ?? 0,
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
                                    <div className="text-muted-foreground text-xs">
                                        {it.code}
                                    </div>
                                    {hasBreakdown && (
                                        <div className="text-muted-foreground text-xs">
                                            {`${formatIDR(unitPriceCents)} × ${qty} ${unit}`}
                                        </div>
                                    )}
                                </div>
                                <div className="font-medium">
                                    {formatIDR(it.amount_idr)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
