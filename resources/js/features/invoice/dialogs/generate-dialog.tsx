import { router } from '@inertiajs/react';
import React from 'react';

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
import SearchSelect, { type SearchOption } from '@/components/ui/search-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLengthRule } from '@/hooks/use-length-rule';
import type { ContractOption } from '@/types/management';

export default function GenerateInvoiceDialog({
    open,
    onOpenChange,
    contracts = [],
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    contracts?: ContractOption[];
}) {
    const [saving, setSaving] = React.useState(false);
    const [form, setForm] = React.useState({
        mode: 'per_month' as 'per_month' | 'full',
        contractId: null as string | null,
        periodMonth: '',
        reason: '',
    });

    const resetForm = React.useCallback(() => {
        setForm({
            mode: 'per_month',
            contractId: null,
            periodMonth: '',
            reason: '',
        });
        setSaving(false);
    }, []);

    const selected = React.useMemo(
        () => (contracts || []).find((c) => c.id === form.contractId) || null,
        [contracts, form.contractId],
    );
    const isMonthly =
        String(selected?.period || '').toLowerCase() === 'monthly';

    React.useEffect(() => {
        if (!form.contractId) return;
        if (!isMonthly && form.mode !== 'full') {
            setForm((s) => ({
                ...s,
                mode: 'full',
            }));
        }
    }, [form.contractId, isMonthly, form.mode]);

    const reasonRule = useLengthRule(form.reason, {
        min: 20,
        max: 200,
        required: true,
        trim: true,
    });

    React.useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open, resetForm]);

    const canSubmit = React.useMemo(() => {
        if (!form.contractId || !reasonRule.valid) return false;
        if (isMonthly) {
            if (form.mode === 'per_month') return !!form.periodMonth;
            return true;
        }
        return true;
    }, [
        form.contractId,
        form.mode,
        form.periodMonth,
        isMonthly,
        reasonRule.valid,
    ]);

    const submit = React.useCallback(() => {
        if (!canSubmit) return;
        setSaving(true);
        const payload =
            form.mode === 'per_month'
                ? {
                      contract_id: form.contractId,
                      mode: 'per_month' as const,
                      period_month: form.periodMonth,
                      reason: form.reason.trim(),
                  }
                : {
                      contract_id: form.contractId,
                      mode: 'full' as const,
                      reason: form.reason.trim(),
                  };
        router.post(route('management.invoices.generate'), payload, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
            onSuccess: () => {
                resetForm();
                onOpenChange(false);
            },
        });
    }, [form, canSubmit, onOpenChange, resetForm]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Generate Invoice</DialogTitle>
                    <DialogDescription>
                        Pilih kontrak dan periode
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Kontrak</Label>
                        <SearchSelect
                            options={
                                (contracts || []).map((c) => ({
                                    value: c.id,
                                    label: c.name,
                                    description: [
                                        c.period,
                                        c.start_date,
                                        c.end_date,
                                    ]
                                        .filter(Boolean)
                                        .join(' • '),
                                })) as SearchOption[]
                            }
                            value={form.contractId ?? undefined}
                            onChange={(value) =>
                                setForm((s) => ({ ...s, contractId: value }))
                            }
                            placeholder="Cari kontrak…"
                        />
                        <InputError name="contract_id" reserveSpace={false} />
                    </div>
                    {isMonthly ? (
                        <>
                            <div className="space-y-2">
                                <Label>Mode</Label>
                                <Select
                                    value={form.mode}
                                    onValueChange={(v: 'per_month' | 'full') =>
                                        setForm((s) => ({
                                            ...s,
                                            mode: v,
                                            periodMonth:
                                                v === 'per_month'
                                                    ? s.periodMonth
                                                    : '',
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="per_month">
                                            Per Bulan
                                        </SelectItem>
                                        <SelectItem value="full">
                                            Lunas
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {form.mode === 'per_month' ? (
                                <div className="space-y-2">
                                    <Label>Bulan</Label>
                                    <input
                                        type="month"
                                        className="h-9 w-full rounded-md border bg-background px-3 text-sm shadow-sm focus:outline-none"
                                        value={form.periodMonth}
                                        min={
                                            selected?.start_date
                                                ? String(
                                                      selected.start_date,
                                                  ).slice(0, 7)
                                                : undefined
                                        }
                                        max={
                                            selected?.end_date
                                                ? String(
                                                      selected.end_date,
                                                  ).slice(0, 7)
                                                : undefined
                                        }
                                        onChange={(e) =>
                                            setForm((s) => ({
                                                ...s,
                                                periodMonth: e.target.value,
                                            }))
                                        }
                                    />
                                    <InputError
                                        name="period_month"
                                        reserveSpace={false}
                                    />
                                </div>
                            ) : null}
                        </>
                    ) : null}
                    <div className="space-y-2">
                        <Label>Catatan</Label>
                        <Textarea
                            rows={3}
                            value={form.reason}
                            onChange={(e) =>
                                setForm((s) => ({
                                    ...s,
                                    reason: e.target.value,
                                }))
                            }
                            placeholder="Contoh: Penagihan sesuai kontrak"
                            maxLength={200}
                        />
                        <div className="mt-1 flex items-center justify-end text-[11px] text-muted-foreground">
                            <span>
                                {reasonRule.length}/
                                {reasonRule.length < 20 ? 20 : 200}
                                {reasonRule.length < 20 ? '*' : ''}
                            </span>
                        </div>
                        <InputError name="reason" reserveSpace={false} />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        disabled={!canSubmit || saving}
                        onClick={submit}
                    >
                        {saving ? 'Memproses…' : 'Generate'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
