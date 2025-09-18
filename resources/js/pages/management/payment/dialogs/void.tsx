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
import { formatIDR } from '@/lib/format';
import { useLengthRule } from '@/hooks/use-length-rule';
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
    const rule = useLengthRule(reason, { min: 1, max: 200, required: true });

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Batalkan Pembayaran</AlertDialogTitle>
                    <AlertDialogDescription>
                        {target ? (
                            <>
                                Anda akan membatalkan pembayaran untuk invoice{' '}
                                <span className="font-mono font-semibold">
                                    {target.invoice ?? '-'}
                                </span>
                                . Nominal {formatIDR(target.amount_cents)}.
                            </>
                        ) : null}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                    <Label>Alasan pembatalan</Label>
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Contoh: salah input, transfer dibatalkan, dsb."
                        rows={3}
                        required
                        maxLength={200}
                        autoFocus
                    />
                    <div className="mt-1 flex items-center justify-end text-[11px] text-muted-foreground">
                        <span>{rule.length}/200</span>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={() => onOpenChange(false)}
                    >
                        Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={!rule.valid || processing}
                        onClick={() => onConfirm(reason)}
                    >
                        Batalkan Sekarang
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

