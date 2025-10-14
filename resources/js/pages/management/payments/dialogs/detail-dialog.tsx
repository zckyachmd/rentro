import React from 'react';
import { useTranslation } from 'react-i18next';

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
import type {
    ManagementPaymentDetailDTO as PaymentDetailDTO,
    ManagementPaymentDetailTarget as Target,
} from '@/types/management';

function usePaymentDetailLoader(target: Target) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<PaymentDetailDTO | null>(null);

    React.useEffect(() => {
        const controller = createAbort();
        (async () => {
            if (!target) return;
            setLoading(true);
            setData(null);
            try {
                const json = await getJson<PaymentDetailDTO>(
                    route('management.payments.show', target.id),
                    { signal: controller.signal },
                );
                setData(json);
            } catch {
                // ignore
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        })();
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
    const { t } = useTranslation();
    const { t: tMgmtPayment } = useTranslation('management/payment');

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {tMgmtPayment('title')}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        {tMgmtPayment('desc')}
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
                    {(Array.isArray(data?.payment?.attachments) &&
                        (data?.payment?.attachments?.length ?? 0) > 0) ||
                    data?.payment?.attachment ? (
                        <Button
                            type="button"
                            onClick={() => setPreviewOpen(true)}
                        >
                            {t('payment.review.view_proof')}
                        </Button>
                    ) : null}
                    <Button type="button" variant="outline" onClick={onClose}>
                        {t('common.close')}
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
    data: PaymentDetailDTO;
    previewOpen: boolean;
    setPreviewOpen: (v: boolean) => void;
}) {
    const { t } = useTranslation();
    const p = data.payment;
    const inv = data.invoice;
    const tenant = data.tenant;
    const room = data.room;

    const attachmentUrl = React.useMemo(() => {
        return route('management.payments.attachment', p.id);
    }, [p.id]);
    const attachmentUrls = React.useMemo(() => {
        const list = data.payment?.attachments;
        const count =
            Array.isArray(list) && list.length
                ? list.length
                : p.attachment
                  ? 1
                  : 0;
        return Array.from(
            { length: count },
            (_, i) => `${route('management.payments.attachment', p.id)}?i=${i}`,
        );
    }, [data.payment?.attachments, p.id, p.attachment]);

    return (
        <div className="space-y-3 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                        {t('payment.detail.info')}
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-y-1">
                        <Label>{t('payment.form.method')}</Label>
                        <div>
                            {t(
                                `payment.method.${String(p.method || '')
                                    .trim()
                                    .toLowerCase()
                                    .replace(/\s+/g, '_')}`,
                                { ns: 'enum', defaultValue: p.method },
                            )}
                        </div>
                        <Label>{t('common.status')}</Label>
                        <div>
                            {t(
                                `payment.status.${String(p.status || '')
                                    .trim()
                                    .toLowerCase()
                                    .replace(/\s+/g, '_')}`,
                                { ns: 'enum', defaultValue: p.status },
                            )}
                        </div>
                        <Label>{t('common.amount')}</Label>
                        <div>{formatIDR(p.amount_idr)}</div>
                        <Label>{t('payment.form.paid_at')}</Label>
                        <div>{formatDate(p.paid_at, true)}</div>
                        <Label>{t('payment.form.receiver_bank')}</Label>
                        <div className="text-right">
                            {p.receiver_bank
                                ? `${p.receiver_bank} — ${p.receiver_account || ''} ${p.receiver_holder ? `(${p.receiver_holder})` : ''}`
                                : '-'}
                        </div>
                        <Label>{t('common.reference')}</Label>
                        <div>{p.reference ?? '-'}</div>
                        <Label>{t('common.recorded_by')}</Label>
                        <div>{p.recorded_by ?? '-'}</div>
                    </div>
                </div>
                <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                        {t('invoice.title')}
                    </div>
                    {inv ? (
                        <div className="grid grid-cols-[1fr_auto] gap-y-1">
                            <Label>{t('invoice.number_label')}</Label>
                            <div className="font-mono">{inv.number}</div>
                            <Label>{t('common.billed_to')}</Label>
                            <div>{tenant?.name ?? '-'}</div>
                            <Label>{t('common.room')}</Label>
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
                            <Label>{t('common.due_date')}</Label>
                            <div>{formatDate(inv.due_date)}</div>
                            <Label>{t('common.status')}</Label>
                            <div>
                                {t(
                                    `invoice.status.${String(inv.status || '')
                                        .trim()
                                        .toLowerCase()
                                        .replace(/\s+/g, '_')}`,
                                    { ns: 'enum', defaultValue: inv.status },
                                )}
                            </div>
                            <Label>{t('common.amount')}</Label>
                            <div>{formatIDR(inv.amount_idr)}</div>
                        </div>
                    ) : (
                        <div className="text-muted-foreground">
                            {t('payment.no_invoice')}
                        </div>
                    )}
                </div>
            </div>
            {p.note ? (
                <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                        {t('common.note')}
                    </div>
                    <div className="text-muted-foreground text-sm break-words whitespace-pre-wrap">
                        {p.note}
                    </div>
                </div>
            ) : null}
            <AttachmentPreviewDialog
                url={attachmentUrl}
                urls={attachmentUrls}
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                title={t('payment.attachments_title')}
                description={t('payment.attachments_desc')}
                details={[
                    {
                        label: t('common.amount'),
                        value: formatIDR(p.amount_idr),
                    },
                    { label: t('common.tenant'), value: tenant?.name || '-' },
                    {
                        label: t('invoice.number_label'),
                        value: inv?.number || '-',
                    },
                ]}
            />
        </div>
    );
}
