import React from 'react';

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
    const [reason, setReason] = React.useState('');
    React.useEffect(() => {
        if (!open) setReason('');
    }, [open]);
    const rule = useLengthRule(reason, {
        min: 1,
        max: 200,
        required: turningOff,
    });
    // no local error text — use asterisk and disable submit until meets min

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {turningOff
                            ? 'Hentikan Auto‑renew'
                            : 'Nyalakan Auto‑renew'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {turningOff
                            ? 'Kontrak tidak akan diperpanjang otomatis di akhir periode.'
                            : 'Kontrak akan diperpanjang otomatis di akhir periode.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {turningOff && (
                    <div className="space-y-2 py-2">
                        <Label>Alasan penghentian</Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Contoh: permintaan tenant, penyesuaian kontrak, dll."
                            required
                            rows={3}
                            maxLength={200}
                        />
                        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>
                                {rule.length}/{rule.length < 1 ? 1 : 200}
                                {turningOff && rule.length < 1 ? '*' : ''}
                            </span>
                        </div>
                    </div>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={turningOff && !rule.valid}
                        onClick={() => onConfirm(reason)}
                    >
                        Konfirmasi
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
