import { router } from '@inertiajs/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
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
import InputError from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLengthRule } from '@/hooks/use-length-rule';
import { createAbort, getJson } from '@/lib/api';
import { formatDate, formatIDR } from '@/lib/format';
import type {
    ManagementPaymentShowDTO as PaymentShow,
    ManagementPaymentDetailTarget as Target,
} from '@/types/management';

function usePayment(target: Target) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<PaymentShow | null>(null);
    React.useEffect(() => {
        const ctrl = createAbort();
        (async () => {
            if (!target) return;
            setLoading(true);
            try {
                const json = await getJson<PaymentShow>(
                    route('management.payments.show', target.id),
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

export default function PaymentReviewDialog({
    target,
    onClose,
}: {
    target: Target;
    onClose: () => void;
}) {
    const open = !!target;
    const { loading, data } = usePayment(target);
    const { t } = useTranslation();
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

    const [previewOpen, setPreviewOpen] = React.useState(false);
    const attachmentUrls = React.useMemo(() => {
        const list = data?.payment?.attachments;
        const count =
            Array.isArray(list) && list.length
                ? list.length
                : data?.payment?.attachment
                  ? 1
                  : 0;
        return target
            ? Array.from(
                  { length: count },
                  (_, i) =>
                      `${route('management.payments.attachment', target.id)}?i=${i}`,
              )
            : [];
    }, [data?.payment?.attachments, data?.payment?.attachment, target]);

    const submit = React.useCallback(() => {
        if (!target) return;
        if (!decision) return;
        if (decision === 'approve' && !ack) return;
        if (decision === 'reject' && !noteRule.meetsMin) return;
        if (decision === 'approve' && noteRule.length > 0 && !noteRule.meetsMin)
            return;

        const fd = new FormData();
        if (decision === 'approve') {
            fd.append('ack', 'on');
            if (noteRule.meetsMin) fd.append('note', note);
        } else {
            fd.append('reason', note);
        }
        // Do not send paid_at from admin review UI

        router.post(route('management.payments.ack', target.id), fd, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                // reset local state and close
                setAck(false);
                setNote('');
                setDecision('approve');
                setPreviewOpen(false);
                onClose();
                // refresh table
                router.reload({ preserveUrl: true });
            },
        });
    }, [
        target,
        ack,
        note,
        decision,
        noteRule.length,
        noteRule.meetsMin,
        onClose,
    ]);

    const decisionError = !decision
        ? t('payment.review.decision_required')
        : '';

    const p = data?.payment;
    const inv = data?.invoice;
    const tenant = data?.tenant;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{t('payment.review.title')}</DialogTitle>
                    <DialogDescription className="text-xs">
                        {t('payment.review.desc')}
                    </DialogDescription>
                </DialogHeader>
                {loading || !p ? (
                    <div className="h-40 animate-pulse rounded-md border" />
                ) : (
                    <div className="space-y-4 pb-2 text-sm">
                        <div className="rounded-lg border p-3">
                            <div className="mb-3 flex items-start justify-between gap-2">
                                <div>
                                    <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                        {t('common.summary')}
                                    </div>
                                    <div className="text-muted-foreground mt-0.5 text-[11px]">
                                        {t('payment.review.check_hint')}
                                    </div>
                                </div>
                                <span className="bg-muted text-foreground/80 rounded-full px-2 py-0.5 text-[11px]">
                                    {t(
                                        `payment.status.${String(p.status || '')
                                            .trim()
                                            .toLowerCase()
                                            .replace(/\s+/g, '_')}`,
                                        { ns: 'enum', defaultValue: p.status },
                                    )}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-y-1 sm:grid-cols-2">
                                <div className="text-muted-foreground">
                                    {t('invoice.title')}
                                </div>
                                <div className="font-mono">
                                    {inv?.number ?? '-'}
                                </div>
                                <div className="text-muted-foreground">
                                    {t('common.tenant')}
                                </div>
                                <div>{tenant?.name ?? '-'}</div>
                                <div className="text-muted-foreground">
                                    {t('common.amount')}
                                </div>
                                <div>{formatIDR(p.amount_idr)}</div>
                                <div className="text-muted-foreground">
                                    {t('payment.form.method')}
                                </div>
                                <div>
                                    {t(
                                        `payment.method.${String(p.method || '')
                                            .trim()
                                            .toLowerCase()
                                            .replace(/\s+/g, '_')}`,
                                        { ns: 'enum', defaultValue: p.method },
                                    )}
                                </div>
                                <div className="text-muted-foreground">
                                    {t('payment.form.paid_at')}
                                </div>
                                <div>{formatDate(p.paid_at, true)}</div>
                                <div className="text-muted-foreground">
                                    {t('payment.form.receiver_bank')}
                                </div>
                                <div>
                                    {p.receiver_bank
                                        ? `${p.receiver_bank} — ${p.receiver_account || ''} ${p.receiver_holder ? `(${p.receiver_holder})` : ''}`
                                        : '-'}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border p-3">
                            <div className="text-muted-foreground mb-3 flex items-center justify-between text-xs font-medium tracking-wide uppercase">
                                <span>{t('common.review')}</span>
                                {attachmentUrls.length > 0 ? (
                                    <button
                                        type="button"
                                        className="text-primary underline"
                                        onClick={() => setPreviewOpen(true)}
                                    >
                                        {t('payment.review.view_proof')}
                                    </button>
                                ) : null}
                            </div>
                            <div className="space-y-3">
                                {p.note ? (
                                    <div className="bg-muted/30 rounded-md border p-2 text-xs">
                                        <div className="text-foreground mb-1 font-medium">
                                            {t('payment.review.sender_note')}
                                        </div>
                                        <div className="text-muted-foreground break-words whitespace-pre-wrap">
                                            {p.note}
                                        </div>
                                    </div>
                                ) : null}
                                <div className="space-y-1">
                                    <Label>
                                        {t('payment.review.decision')}
                                    </Label>
                                    <div className="flex items-center gap-3 text-sm">
                                        <label className="inline-flex cursor-pointer items-center gap-2">
                                            <input
                                                type="radio"
                                                name="decision"
                                                value="approve"
                                                className="h-4 w-4"
                                                checked={decision === 'approve'}
                                                onChange={() =>
                                                    setDecision('approve')
                                                }
                                            />
                                            <span>
                                                {t('payment.review.approve')}
                                            </span>
                                        </label>
                                        <label className="inline-flex cursor-pointer items-center gap-2">
                                            <input
                                                type="radio"
                                                name="decision"
                                                value="reject"
                                                className="h-4 w-4"
                                                checked={decision === 'reject'}
                                                onChange={() =>
                                                    setDecision('reject')
                                                }
                                            />
                                            <span>
                                                {t('payment.review.reject')}
                                            </span>
                                        </label>
                                    </div>
                                    <InputError message={decisionError} />
                                </div>

                                <div className="space-y-1">
                                    <Label>
                                        {t('common.note')}
                                        <span className="text-muted-foreground ml-1">
                                            {decision === 'reject'
                                                ? t(
                                                      'payment.review.note_required_hint',
                                                  )
                                                : t('common.optional')}
                                        </span>
                                    </Label>
                                    <Textarea
                                        value={note}
                                        onChange={(e) =>
                                            setNote(e.target.value)
                                        }
                                        rows={3}
                                        placeholder={
                                            decision === 'reject'
                                                ? t(
                                                      'payment.review.note_placeholder_required',
                                                  )
                                                : t(
                                                      'payment.form.note_placeholder',
                                                  )
                                        }
                                    />
                                    <div className="text-muted-foreground flex items-center justify-end text-[11px]">
                                        <span>
                                            {showCounter
                                                ? `${noteRule.length}/${MIN_NOTE}${decision === 'reject' && noteRule.length < MIN_NOTE ? '*' : ''}`
                                                : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-[12px] text-yellow-900 dark:border-yellow-900/40 dark:bg-yellow-950 dark:text-yellow-100">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="ack"
                                            checked={ack}
                                            onCheckedChange={(v) =>
                                                setAck(Boolean(v))
                                            }
                                        />
                                        <label
                                            htmlFor="ack"
                                            className="cursor-pointer"
                                        >
                                            {t('payment.review.ack')}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {target ? (
                            <AttachmentPreviewDialog
                                url={route(
                                    'management.payments.attachment',
                                    target.id,
                                )}
                                urls={attachmentUrls}
                                open={previewOpen}
                                onOpenChange={setPreviewOpen}
                                title={t('payment.attachments_title')}
                                description={t('payment.attachments_desc')}
                            />
                        ) : null}
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {t('common.close')}
                    </Button>
                    <Can all={['payment.update']}>
                        <Button
                            onClick={submit}
                            disabled={
                                !decision ||
                                (decision === 'reject' && !noteRule.meetsMin) ||
                                (decision === 'approve' &&
                                    (!ack ||
                                        (noteRule.length > 0 &&
                                            !noteRule.meetsMin)))
                            }
                        >
                            {t('common.submit')}
                        </Button>
                    </Can>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
