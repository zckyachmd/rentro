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

export default function ToggleAutoRenewDialog({
    target,
    onOpenChange,
    onConfirm,
}: {
    target: ContractItem | null;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
}) {
    const open = !!target;
    const turningOff = Boolean(target?.auto_renew);
    const { t } = useTranslation('management/contract');
    const [reason, setReason] = React.useState('');

    React.useEffect(() => {
        if (!open) setReason('');
    }, [open]);

    const rule = useLengthRule(reason, {
        min: 1,
        max: 200,
        required: turningOff,
    });

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {turningOff
                            ? t('autorenew.stop_title')
                            : t('autorenew.start_title')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {turningOff
                            ? t('autorenew.stop_desc')
                            : t('autorenew.start_desc')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {turningOff && (
                    <div className="space-y-2 py-2">
                        <Label>{t('autorenew.reason_label')}</Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t('autorenew.reason_placeholder')}
                            required
                            rows={3}
                            maxLength={200}
                        />
                        <div className="text-muted-foreground mt-1 flex items-center justify-between text-[11px]">
                            <span>
                                {rule.length}/{rule.length < 1 ? 1 : 200}
                                {turningOff && rule.length < 1 ? '*' : ''}
                            </span>
                        </div>
                    </div>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <Can all={['contract.renew']}>
                        <AlertDialogAction
                            disabled={turningOff && !rule.valid}
                            onClick={() => onConfirm(reason)}
                        >
                            {t('common.confirm')}
                        </AlertDialogAction>
                    </Can>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
