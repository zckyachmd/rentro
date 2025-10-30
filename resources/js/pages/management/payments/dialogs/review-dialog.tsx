import React from 'react';
import { useTranslation } from 'react-i18next';

import { Can } from '@/components/acl';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLengthRule } from '@/hooks/use-length-rule';
import { formatIDR } from '@/lib/format';
import type { PaymentRow } from '@/types/management';

export default function VoidPaymentDialog({
    target,
    onOpenChange,
    onConfirm,
    processing = false,
}: {
    target: PaymentRow | null;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
    processing?: boolean;
}) {
    const open = !!target;
    const [reason, setReason] = React.useState('');
    React.useEffect(() => {
        if (!open) setReason('');
    }, [open]);
    const rule = useLengthRule(reason, { min: 20, max: 200, required: true });
    const { t } = useTranslation();

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {t('payment.void.title')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {target ? (
                            <>
                                {t('payment.void.desc', {
                                    number: target.invoice ?? '-',
                                    amount: formatIDR(target.amount_idr),
                                })}
                            </>
                        ) : null}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                    <Label>{t('payment.cancel_reason')}</Label>
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t('payment.cancel_reason_placeholder')}
                        rows={3}
                        required
                        maxLength={200}
                        autoFocus
                    />
                    <div className="text-muted-foreground mt-1 flex items-center justify-end text-[11px]">
                        <span>
                            {rule.length}/{rule.length < 20 ? 20 : 200}
                            {rule.length < 20 ? '*' : ''}
                        </span>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>
                        {t('common.cancel')}
                    </AlertDialogCancel>
                    <Can all={['payment.update']}>
                        <AlertDialogAction
                            disabled={!rule.valid || processing}
                            onClick={() => onConfirm(reason)}
                        >
                            {t('payment.void_now')}
                        </AlertDialogAction>
                    </Can>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
