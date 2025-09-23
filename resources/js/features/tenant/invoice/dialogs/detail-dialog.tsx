import React from 'react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    return (
        <>
            <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('tenant.invoice.detail.title')}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {t('tenant.invoice.detail.subtitle')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {loading || !data ? (
                            <div className="h-40 animate-pulse rounded-md border" />
                        ) : (
                            <div className="space-y-3 text-sm">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-lg border p-3">
                                        <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                                            {t('tenant.invoice.detail.info')}
                                        </div>
                                        <div className="grid grid-cols-[1fr_auto] gap-y-1">
                                            <Label>{t('common.number')}</Label>
                                            <div className="font-mono">
                                                {data.invoice.number}
                                            </div>
                                            <Label>
                                                {t('common.due_date')}
                                            </Label>
                                            <div>
                                                {formatDate(
                                                    data.invoice.due_date,
                                                )}
                                            </div>
                                            <Label>{t('common.status')}</Label>
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
                                                <div className="text-muted-foreground col-span-2 mt-1 text-[11px]">
                                                    {t(
                                                        'tenant.invoice.detail.cancelled_note',
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                        <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                                            {t('tenant.invoice.amounts')}
                                        </div>
                                        <div className="grid grid-cols-[1fr_auto] gap-y-1">
                                            <Label>{t('common.total')}</Label>
                                            <div>
                                                {formatIDR(
                                                    data.invoice.amount_cents,
                                                )}
                                            </div>
                                            <Label>
                                                {t(
                                                    'tenant.invoice.outstanding',
                                                )}
                                            </Label>
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
                                            <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                                                {t(
                                                    'tenant.invoice.detail.items',
                                                )}
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
                                            <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                                                {t(
                                                    'tenant.invoice.detail.payment_history',
                                                )}
                                            </div>
                                            <ScrollArea className="bg-background/40 max-h-[280px] rounded-md border border-dashed">
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
                                                                setPaymentDetail(
                                                                    {
                                                                        id: pmt.id,
                                                                    },
                                                                )
                                                            }
                                                            className="hover:bg-muted/30 flex w-full items-start justify-between gap-3 text-left"
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="text-muted-foreground text-xs">
                                                                    {pmt.method}{' '}
                                                                    •{' '}
                                                                    {formatDate(
                                                                        pmt.paid_at,
                                                                        true,
                                                                    )}
                                                                </div>
                                                                {pmt.reference ? (
                                                                    <div className="text-muted-foreground mt-0.5 text-[11px]">
                                                                        {t(
                                                                            'tenant.invoice.detail.reference',
                                                                        )}
                                                                        :{' '}
                                                                        {
                                                                            pmt.reference
                                                                        }
                                                                    </div>
                                                                ) : null}
                                                                {pmt.receiver_bank ? (
                                                                    <div className="text-muted-foreground mt-0.5 text-[11px]">
                                                                        {t(
                                                                            'tenant.invoice.detail.receiver_bank',
                                                                        )}
                                                                        :{' '}
                                                                        {
                                                                            pmt.receiver_bank
                                                                        }
                                                                        {pmt.receiver_account
                                                                            ? ` — ${pmt.receiver_account}`
                                                                            : ''}
                                                                        {pmt.receiver_holder
                                                                            ? ` (${pmt.receiver_holder})`
                                                                            : ''}
                                                                    </div>
                                                                ) : null}
                                                                {pmt.reject_reason ? (
                                                                    <div className="text-destructive mt-0.5 text-[11px]">
                                                                        {t(
                                                                            'tenant.invoice.detail.rejected',
                                                                        )}
                                                                        :{' '}
                                                                        {
                                                                            pmt.reject_reason
                                                                        }
                                                                    </div>
                                                                ) : null}
                                                                {pmt.note ? (
                                                                    <div className="text-muted-foreground mt-0.5 text-[11px] break-words whitespace-pre-wrap">
                                                                        {pmt.review_by
                                                                            ? `${t('tenant.invoice.detail.admin_note')}:`
                                                                            : `${t('tenant.invoice.detail.note')}:`}{' '}
                                                                        {
                                                                            pmt.note
                                                                        }
                                                                    </div>
                                                                ) : null}
                                                                {pmt.review_by ||
                                                                pmt.review_at ? (
                                                                    <div className="text-muted-foreground mt-0.5 text-[11px]">
                                                                        {pmt.review_by
                                                                            ? `${t('tenant.invoice.detail.reviewed_by')} ${pmt.review_by}`
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
                                        ? t('tenant.invoice.pay_again')
                                        : t('common.pay');
                                })()}
                            </Button>
                        ) : null}
                        <Button variant="outline" onClick={onClose}>
                            {t('common.close')}
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
