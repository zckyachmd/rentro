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

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Batalkan Invoice</AlertDialogTitle>
                    <AlertDialogDescription>
                        {target ? (
                            <>
                                Anda akan membatalkan invoice{' '}
                                <span className="font-mono font-semibold">
                                    {target.number}
                                </span>
                                . Tindakan ini tidak dapat dibatalkan.
                            </>
                        ) : null}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                    <Label>Alasan pembatalan</Label>
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Contoh: duplikasi tagihan, salah nominal, dll."
                        required
                        rows={3}
                        autoFocus
                        maxLength={200}
                    />
                    <div className="mt-1 flex items-center justify-end text-[11px] text-muted-foreground">
                        <span>
                            {rule.length}/{rule.length < 20 ? 20 : 200}
                            {rule.length < 20 ? '*' : ''}
                        </span>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={!rule.valid}
                        onClick={() => onConfirm(reason)}
                    >
                        Batalkan Sekarang
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
