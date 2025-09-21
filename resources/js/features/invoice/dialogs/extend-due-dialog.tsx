import React from 'react';

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
    const dueDateError = !dueDate ? 'Wajib diisi.' : '';
    const canSubmit = !processing && !dueDateError && reasonRule.valid;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Perpanjang Jatuh Tempo</DialogTitle>
                    <DialogDescription>
                        Atur tanggal jatuh tempo baru dan alasannya.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Tanggal Jatuh Tempo Baru</Label>
                        <DatePickerInput
                            id="extend-due-input"
                            value={dueDate}
                            onChange={(v) => setDueDate(v || '')}
                        />
                        <InputError message={dueDateError} />
                    </div>
                    <div className="space-y-2">
                        <Label>Alasan</Label>
                        <Textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Contoh: permintaan penyewa, kendala teknis, dll."
                            maxLength={200}
                        />
                        <div className="mt-1 flex items-center justify-end text-[11px] text-muted-foreground">
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
                        Batal
                    </Button>
                    <Button
                        disabled={!canSubmit}
                        onClick={() => onConfirm(dueDate, reason)}
                    >
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
