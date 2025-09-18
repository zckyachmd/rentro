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

    const rule = useLengthRule(reason, { min: 3, max: 200, required: true });
    const canSave = !!dueDate && rule.valid && !processing;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Perpanjang Jatuh Tempo</DialogTitle>
                    <DialogDescription>
                        Atur tanggal jatuh tempo baru untuk invoice
                        Pending/Overdue ini dan berikan alasan.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <div className="space-y-2">
                        <Label>Tanggal Jatuh Tempo Baru</Label>
                        <DatePickerInput
                            value={dueDate}
                            onChange={(v) => setDueDate(v ?? '')}
                            min={initialDueDate}
                            placeholder="Pilih tanggal"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Alasan perpanjangan</Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Contoh: memberi keringanan, kendala transfer, dsb."
                            rows={3}
                            required
                            maxLength={200}
                        />
                        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                            {rule.length}/200
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={processing}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        disabled={!canSave}
                        onClick={() => onConfirm(dueDate, reason)}
                    >
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
