import React from 'react';
import { useTranslation } from 'react-i18next';

import { DatePickerInput } from '@/components/date-picker';
import { Button } from '@/components/ui/button';
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
import type { InvoiceRow } from '@/types/management';

export default function ExtendDueDialog({
    open,
    initialDueDate,
    onOpenChange,
    onConfirm,
    processing = false,
}: {
    target: InvoiceRow | null;
    open: boolean;
    initialDueDate: string;
    onOpenChange: (open: boolean) => void;
    onConfirm: (dueDate: string, reason: string) => void;
    processing?: boolean;
}) {
    const { t } = useTranslation();
    const { t: tInvoice } = useTranslation('management/invoice');
    const [dueDate, setDueDate] = React.useState<string>('');
    const [reason, setReason] = React.useState<string>('');

    React.useEffect(() => {
        if (open) {
            setDueDate(initialDueDate || '');
            setReason('');
        }
    }, [open, initialDueDate]);

    const reasonRule = useLengthRule(reason, {
        min: 20,
        max: 200,
        required: true,
        trim: true,
    });
    const dueDateError = !dueDate ? t('form.required') : '';
    const canSubmit = !processing && !dueDateError && reasonRule.valid;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{tInvoice('extend_due.title')}</DialogTitle>
                    <DialogDescription>
                        {tInvoice('extend_due.desc')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>{tInvoice('extend_due.new_due_date')}</Label>
                        <DatePickerInput
                            id="extend-due-input"
                            value={dueDate}
                            onChange={(v) => setDueDate(v || '')}
                        />
                        <InputError message={dueDateError} />
                    </div>
                    <div className="space-y-2">
                        <Label>{tInvoice('extend_due.reason')}</Label>
                        <Textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={tInvoice(
                                'extend_due.reason_placeholder',
                            )}
                            maxLength={200}
                        />
                        <div className="text-muted-foreground mt-1 flex items-center justify-end text-[11px]">
                            <span>
                                {reasonRule.length}/
                                {reasonRule.length < 20 ? 20 : 200}
                                {reasonRule.length < 20 ? '*' : ''}
                            </span>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        disabled={!canSubmit}
                        onClick={() => onConfirm(dueDate, reason)}
                    >
                        {t('common.save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
