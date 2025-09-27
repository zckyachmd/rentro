import React from 'react';
import { useTranslation } from 'react-i18next';

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
import type { InvoiceRow } from '@/types/management';

export default function CancelInvoiceDialog({
    target,
    onOpenChange,
    onConfirm,
}: {
    target: InvoiceRow | null;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
}) {
    const open = !!target;
    const [reason, setReason] = React.useState('');
    React.useEffect(() => {
        if (!open) setReason('');
    }, [open]);
    const rule = useLengthRule(reason, { min: 20, max: 200, required: true });
    const { t } = useTranslation();
    const { t: tInvoice } = useTranslation('management/invoice');

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {tInvoice('cancel.title')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {target ? (
                            <>
                                {tInvoice('cancel.desc', {
                                    number: target.number,
                                })}
                            </>
                        ) : null}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                    <Label>{tInvoice('cancel.reason_label')}</Label>
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={tInvoice('cancel.reason_placeholder')}
                        required
                        rows={3}
                        autoFocus
                        maxLength={200}
                    />
                    <div className="text-muted-foreground mt-1 flex items-center justify-end text-[11px]">
                        <span>
                            {rule.length}/{rule.length < 20 ? 20 : 200}
                            {rule.length < 20 ? '*' : ''}
                        </span>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={!rule.valid}
                        onClick={() => onConfirm(reason)}
                    >
                        {tInvoice('cancel.confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
