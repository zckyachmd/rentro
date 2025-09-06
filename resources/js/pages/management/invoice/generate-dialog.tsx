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

type ContractOption = {
    id: string;
    name: string;
    period?: 'Monthly' | 'Weekly' | 'Daily' | string;
    start_date?: string | null;
    end_date?: string | null;
};

type Props = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    contracts: ContractOption[];
};

export default function GenerateInvoiceDialog({
    open,
    onOpenChange,
    contracts,
}: Props) {
    type FormState = {
        contractId: string | null;
        mode: 'per_month' | 'full';
        periodMonth: string;
        reason: string;
        rangeFrom: string;
        rangeTo: string;
    };

    const [form, setForm] = React.useState<FormState>({
        contractId: null,
        mode: 'per_month',
        periodMonth: '',
        reason: '',
        rangeFrom: '',
        rangeTo: '',
    });
    const [saving, setSaving] = React.useState(false);

    const selected = React.useMemo(
        () => contracts.find((c) => c.id === (form.contractId ?? '')) ?? null,
        [contracts, form.contractId],
    );
    const isMonthly = selected?.period === 'Monthly';
    const isNonMonthly = selected ? selected.period !== 'Monthly' : false;

    const contractOptions: SearchOption[] = React.useMemo(
        () =>
            contracts.map((c) => ({
                value: c.id,
                label: c.name,
                description: c.period ?? undefined,
                payload: c,
            })),
        [contracts],
    );

    const minMonth = React.useMemo(() => {
        if (!selected?.start_date) return undefined;
        try {
            return selected.start_date.slice(0, 7);
        } catch {
            return undefined;
        }
    }, [selected?.start_date]);
    const maxMonth = React.useMemo(() => {
        if (!selected?.end_date) return undefined;
        try {
            return selected.end_date.slice(0, 7);
        } catch {
            return undefined;
        }
    }, [selected?.end_date]);
    const monthOutOfRange = React.useMemo(() => {
        if (!form.periodMonth || !minMonth || !maxMonth) return false;
        return form.periodMonth < minMonth || form.periodMonth > maxMonth;
    }, [form.periodMonth, minMonth, maxMonth]);

    React.useEffect(() => {
        if (selected && selected.period !== 'Monthly') {
            setForm((s) => ({ ...s, mode: 'full', periodMonth: '' }));
        }
    }, [selected]);

    const onSubmit = React.useCallback(() => {
        if (!form.contractId || !form.reason.trim()) return;
        setSaving(true);
        router.post(
            route('management.invoices.generate'),
            {
                contract_id: form.contractId,
                mode: form.mode,
                reason: form.reason,
                ...(isMonthly && form.mode === 'per_month' && form.periodMonth
                    ? { period_month: form.periodMonth }
                    : {}),
                ...(!isMonthly && form.rangeFrom && form.rangeTo
                    ? { range: { from: form.rangeFrom, to: form.rangeTo } }
                    : {}),
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSaving(false);
                    onOpenChange(false);
                    setForm({
                        contractId: null,
                        mode: 'per_month',
                        periodMonth: '',
                        reason: '',
                        rangeFrom: '',
                        rangeTo: '',
                    });
                },
            },
        );
    }, [form, isMonthly, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Generate Invoice</DialogTitle>
                    <DialogDescription>
                        Buat tagihan cepat untuk kontrak terpilih. Pilih mode &
                        periode (jika bulanan), lalu beri catatan singkat.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Kontrak</Label>
                        <div className="mt-1">
                            <SearchSelect
                                value={form.contractId ?? undefined}
                                onChange={(val) =>
                                    setForm((s) => ({
                                        ...s,
                                        contractId: val || null,
                                    }))
                                }
                                options={contractOptions}
                                placeholder="Cari atau pilih kontrak…"
                            />
                        </div>
                    </div>
                    {/* Mode selection shown below only when monthly */}
                    {selected && isMonthly && (
                        <div className="space-y-2">
                            <div>
                                <Label>Mode</Label>
                                <Select
                                    value={form.mode}
                                    onValueChange={(v) =>
                                        setForm((s) => ({
                                            ...s,
                                            mode: v as 'per_month' | 'full',
                                        }))
                                    }
                                >
                                    <SelectTrigger className="mt-1 w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="per_month">
                                            Bulanan (pilih bulan)
                                        </SelectItem>
                                        <SelectItem value="full">
                                            Lunas (sisa kontrak)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {form.mode === 'per_month' && (
                                <div>
                                    <Label>Bulan</Label>
                                    <input
                                        type="month"
                                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                        value={form.periodMonth}
                                        onChange={(e) =>
                                            setForm((s) => ({
                                                ...s,
                                                periodMonth: e.target.value,
                                            }))
                                        }
                                        min={minMonth}
                                        max={maxMonth}
                                    />
                                    {monthOutOfRange && (
                                        <div className="mt-1 text-xs text-destructive">
                                            Bulan di luar masa kontrak.
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                                Masa kontrak: {selected.start_date ?? '-'} s/d{' '}
                                {selected.end_date ?? '-'}
                            </div>
                        </div>
                    )}
                    <div>
                        <Label>Catatan</Label>
                        <Textarea
                            value={form.reason}
                            onChange={(e) =>
                                setForm((s) => ({
                                    ...s,
                                    reason: e.target.value,
                                }))
                            }
                            placeholder="Contoh: penagihan periode berikutnya, penyesuaian pembayaran, dll."
                            rows={3}
                            required
                            maxLength={200}
                            autoFocus
                        />
                        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{form.reason.length}/200</span>
                        </div>
                    </div>
                </div>
                {selected && isNonMonthly && (
                    <div className="space-y-2">
                        <Label>Rentang (opsional)</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="date"
                                className="rounded-md border px-3 py-2 text-sm"
                                value={form.rangeFrom}
                                onChange={(e) =>
                                    setForm((s) => ({
                                        ...s,
                                        rangeFrom: e.target.value,
                                    }))
                                }
                                min={selected.start_date ?? undefined}
                                max={selected.end_date ?? undefined}
                            />
                            <input
                                type="date"
                                className="rounded-md border px-3 py-2 text-sm"
                                value={form.rangeTo}
                                onChange={(e) =>
                                    setForm((s) => ({
                                        ...s,
                                        rangeTo: e.target.value,
                                    }))
                                }
                                min={selected.start_date ?? undefined}
                                max={selected.end_date ?? undefined}
                            />
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Kosongkan untuk menagih sisa durasi kontrak secara
                            penuh.
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={onSubmit}
                        disabled={
                            saving ||
                            !form.contractId ||
                            !form.reason.trim() ||
                            (isMonthly &&
                                form.mode === 'per_month' &&
                                (!form.periodMonth || monthOutOfRange))
                        }
                    >
                        {saving ? 'Memproses…' : 'Generate'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
