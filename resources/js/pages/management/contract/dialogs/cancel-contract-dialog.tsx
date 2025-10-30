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
import type { ContractItem } from '@/types/management';

export default function CancelContractDialog({
    target,
    onOpenChange,
    onConfirm,
}: {
    target: ContractItem | null;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
}) {
    const open = !!target;
    const [reason, setReason] = React.useState('');
    React.useEffect(() => {
        if (!open) setReason('');
    }, [open]);
    const rule = useLengthRule(reason, { min: 20, max: 200, required: true });
    const { t } = useTranslation('management/contract');

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('cancel.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('cancel.desc')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                    <Label>{t('cancel.reason_label')}</Label>
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t('cancel.reason_placeholder')}
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
                    <Can all={['contract.cancel']}>
                        <AlertDialogAction
                            disabled={!rule.valid}
                            onClick={() => onConfirm(reason)}
                        >
                            {t('cancel.confirm')}
                        </AlertDialogAction>
                    </Can>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
