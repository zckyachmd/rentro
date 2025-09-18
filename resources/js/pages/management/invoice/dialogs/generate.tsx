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

    const contractOptions = React.useMemo<SearchOption[]>(
        () =>
            contracts.map((c) => ({
                value: c.id,
                label: `${c.name}${c.period ? ` — ${c.period}` : ''}`,
                meta: c,
            })),
        [contracts],
    );

    const canSubmit = React.useMemo(() => {
        if (saving) return false;
        if (!form.contractId) return false;
        if (form.mode === 'per_month') return Boolean(form.periodMonth);
        return Boolean(form.rangeFrom && form.rangeTo);
    }, [form, saving]);

    const submit = React.useCallback(() => {
        if (!canSubmit) return;
        setSaving(true);
        const payload =
            form.mode === 'per_month'
                ? {
                      contract_id: form.contractId,
                      period_month: form.periodMonth,
                      reason: form.reason,
                  }
                : {
                      contract_id: form.contractId,
                      range_from: form.rangeFrom,
                      range_to: form.rangeTo,
                      reason: form.reason,
                  };
        router.post(route('management.invoices.generate'), payload, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
            onSuccess: () => onOpenChange(false),
        });
    }, [form, canSubmit, onOpenChange]);

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
                            options={contractOptions}
                            value={form.contractId}
                            onValueChange={(v) =>
                                setForm((s) => ({ ...s, contractId: v }))
                            }
                            placeholder="Cari kontrak…"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Mode</Label>
                        <Select
                            value={form.mode}
                            onValueChange={(v: 'per_month' | 'full') =>
                                setForm((s) => ({ ...s, mode: v }))
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
                                    Rentang Tanggal
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
                                onChange={(e) =>
                                    setForm((s) => ({
                                        ...s,
                                        periodMonth: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Dari</Label>
                                <input
                                    type="date"
                                    className="h-9 w-full rounded-md border bg-background px-3 text-sm shadow-sm focus:outline-none"
                                    value={form.rangeFrom}
                                    onChange={(e) =>
                                        setForm((s) => ({
                                            ...s,
                                            rangeFrom: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Sampai</Label>
                                <input
                                    type="date"
                                    className="h-9 w-full rounded-md border bg-background px-3 text-sm shadow-sm focus:outline-none"
                                    value={form.rangeTo}
                                    onChange={(e) =>
                                        setForm((s) => ({
                                            ...s,
                                            rangeTo: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    )}
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
                            placeholder="Opsional"
                        />
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
