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
    const { t } = useTranslation();
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
                    <DialogTitle>
                        {t('tenant.invoice.payment_detail.title')}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        {t('tenant.invoice.payment_detail.subtitle')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                    {loading || !data ? (
                        <div className="h-40 animate-pulse rounded-md border" />
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border p-3">
                                <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                                    {t('tenant.invoice.payment_detail.info')}
                                </div>
                                <div className="grid grid-cols-[1fr_auto] gap-y-1">
                                    <Label>{t('tenant.invoice.method')}</Label>
                                    <div>{data.payment.method}</div>
                                    <Label>{t('common.status')}</Label>
                                    <div>{data.payment.status}</div>
                                    <Label>{t('common.amount')}</Label>
                                    <div>
                                        {formatIDR(data.payment.amount_cents)}
                                    </div>
                                    <Label>
                                        {t('tenant.invoice.manual.paid_at')}
                                    </Label>
                                    <div>
                                        {formatDate(data.payment.paid_at, true)}
                                    </div>
                                    <Label>
                                        {t('tenant.invoice.detail.reference')}
                                    </Label>
                                    <div>{data.payment.reference || '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-lg border p-3">
                                <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                                    {t(
                                        'tenant.invoice.payment_detail.receiver_section',
                                    )}
                                </div>
                                <div className="grid grid-cols-[1fr_auto] gap-y-1">
                                    <Label>
                                        {t('tenant.invoice.manual.bank')}
                                    </Label>
                                    <div>
                                        {data.payment.receiver_bank || '-'}
                                    </div>
                                    <Label>
                                        {t('tenant.invoice.manual.account_no')}
                                    </Label>
                                    <div className="font-mono">
                                        {data.payment.receiver_account || '-'}
                                    </div>
                                    <Label>
                                        {t('tenant.invoice.manual.name')}
                                    </Label>
                                    <div>
                                        {data.payment.receiver_holder || '-'}
                                    </div>
                                </div>
                            </div>
                            {(data.payment.reject_reason ||
                                data.payment.review_by ||
                                data.payment.note) && (
                                <div className="rounded-lg border p-3 sm:col-span-2">
                                    <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                                        {t(
                                            'tenant.invoice.payment_detail.review_title',
                                        )}
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        {data.payment.reject_reason ? (
                                            <div className="text-destructive">
                                                {t(
                                                    'tenant.invoice.detail.rejected',
                                                )}
                                                : {data.payment.reject_reason}
                                            </div>
                                        ) : null}
                                        {data.payment.note ? (
                                            <div className="text-muted-foreground break-words whitespace-pre-wrap">
                                                {data.payment.review_by
                                                    ? `${t('tenant.invoice.detail.admin_note')}:`
                                                    : `${t('tenant.invoice.detail.note')}:`}{' '}
                                                {data.payment.note}
                                            </div>
                                        ) : null}
                                        {data.payment.review_by ||
                                        data.payment.review_at ? (
                                            <div className="text-muted-foreground text-[12px]">
                                                {data.payment.review_by
                                                    ? `${t('tenant.invoice.detail.reviewed_by')} ${data.payment.review_by}`
                                                    : ''}
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
                        <Button
                            type="button"
                            onClick={() => setPreviewOpen(true)}
                        >
                            {t('tenant.invoice.payment_detail.view_proof')}
                        </Button>
                    ) : null}
                    <Button variant="outline" onClick={onClose}>
                        {t('common.close')}
                    </Button>
                </DialogFooter>
            </DialogContent>
            <AttachmentPreviewDialog
                url={attachmentUrls[0] || ''}
                urls={attachmentUrls}
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                title={t('tenant.invoice.payment_detail.attachments_title')}
                description={t(
                    'tenant.invoice.payment_detail.attachments_desc',
                )}
            />
        </Dialog>
    );
}
