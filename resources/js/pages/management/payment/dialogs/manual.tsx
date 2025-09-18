import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatIDR } from '@/lib/format';

export type MethodOption = { value: string; label: string };

export type ManualPaymentDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    methods: MethodOption[];
    initialInvoiceNumber?: string | null;
};

type ManualPaymentFormData = {
    invoice_number: string;
    invoice_id: string;
    amount_cents: number;
    method: string;
    paid_at: string;
    note: string;
    provider: string;
    attachment: File | null;
};

const currency = (amount: number): string => formatIDR(amount);

export function ManualPaymentDialog({
    open,
    onOpenChange,
    methods,
    initialInvoiceNumber,
}: ManualPaymentDialogProps) {
    const { data, setData, post, processing } = useForm<ManualPaymentFormData>({
        invoice_number: initialInvoiceNumber ?? '',
        invoice_id: '',
        amount_cents: 0,
        method: methods?.[0]?.value ?? 'Cash',
        paid_at: '',
        note: '',
        provider: 'Kasir',
        attachment: null,
    });

    const invoiceNumberRef = React.useRef(data.invoice_number);
    React.useEffect(() => {
        invoiceNumberRef.current = data.invoice_number;
    }, [data.invoice_number]);

    const [lookupLoading, setLookupLoading] = React.useState(false);
    const [lookupError, setLookupError] = React.useState<string | null>(null);
    const amountRef = React.useRef<HTMLInputElement>(null);
    const [resolvedInvoice, setResolvedInvoice] = React.useState<{
        id: string;
        number: string;
        amount: number;
        status: string;
        tenant_name?: string | null;
        outstanding?: number;
        eligible?: boolean;
    } | null>(null);

    const canSubmit =
        !processing &&
        data.invoice_id &&
        data.amount_cents > 0 &&
        data.paid_at.trim().length > 0;

    const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

    const tryLookupInvoice = React.useCallback(async () => {
        if (lookupLoading) return;
        const num = (data.invoice_number || '').trim();
        if (!num) return;
        setLookupError(null);
        setLookupLoading(true);
        setResolvedInvoice(null);
        try {
            const res = await fetch(
                `${route('management.invoices.lookup')}?number=${encodeURIComponent(num)}`,
                { headers: { Accept: 'application/json' } },
            );
            if (!res.ok) throw new Error('Invoice tidak ditemukan');
            const json = (await res.json()) as {
                id?: string;
                number?: string;
                amount?: number;
                status?: string;
                tenant_name?: string | null;
                outstanding?: number;
                eligible?: boolean;
            };
            setResolvedInvoice(
                json?.id
                    ? {
                          id: String(json.id),
                          number: String(json.number ?? num),
                          amount: Number(json.amount ?? 0),
                          status: String(json.status ?? ''),
                          tenant_name: json.tenant_name ?? null,
                          outstanding: json.outstanding ?? 0,
                          eligible: Boolean(json.eligible ?? false),
                      }
                    : null,
            );
            setLookupError(null);
            setData('invoice_id', json?.id ? String(json.id) : '');
            if (json?.id) amountRef.current?.focus();
        } catch (e) {
            setLookupError((e as Error).message || 'Gagal mengambil data');
            setData('invoice_id', '');
        } finally {
            setLookupLoading(false);
        }
    }, [lookupLoading, data.invoice_number, setData]);

    const submit = React.useCallback(() => {
        if (!canSubmit) return;
        const formData = new FormData();
        formData.set('invoice_id', data.invoice_id);
        formData.set('amount_cents', String(data.amount_cents));
        formData.set('method', data.method);
        formData.set('paid_at', data.paid_at);
        formData.set('note', data.note);
        formData.set('provider', data.provider);
        if (data.attachment) formData.append('attachment', data.attachment);
        post(route('management.payments.storeManual'), formData, {
            preserveScroll: true,
            onSuccess: () => close(),
        });
    }, [canSubmit, data, post, close]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Pembayaran Manual</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                    <div className="space-y-2">
                        <Label>Nomor Invoice</Label>
                        <div className="flex gap-2">
                            <Input
                                value={data.invoice_number}
                                onChange={(e) =>
                                    setData('invoice_number', e.target.value)
                                }
                                placeholder="INV-xxx"
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                disabled={
                                    lookupLoading || !data.invoice_number.trim()
                                }
                                onClick={tryLookupInvoice}
                            >
                                {lookupLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Mencari…
                                    </>
                                ) : (
                                    'Cari'
                                )}
                            </Button>
                        </div>
                        {lookupError ? (
                            <div className="text-xs text-destructive">
                                {lookupError}
                            </div>
                        ) : null}
                        {resolvedInvoice ? (
                            <div className="rounded-md border p-2 text-xs">
                                <div className="font-mono">
                                    {resolvedInvoice.number}
                                </div>
                                <div className="text-muted-foreground">
                                    Nilai: {currency(resolvedInvoice.amount)}{' '}
                                    &middot; Sisa:{' '}
                                    {currency(resolvedInvoice.outstanding ?? 0)}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Metode</Label>
                            <Select
                                value={data.method}
                                onValueChange={(v) => setData('method', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {methods.map((m) => (
                                        <SelectItem
                                            key={m.value}
                                            value={m.value}
                                        >
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tanggal Bayar</Label>
                            <Input
                                type="datetime-local"
                                value={data.paid_at}
                                onChange={(e) =>
                                    setData('paid_at', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Nilai Bayar</Label>
                            <Input
                                ref={amountRef}
                                type="number"
                                min="0"
                                value={data.amount_cents}
                                onChange={(e) =>
                                    setData(
                                        'amount_cents',
                                        Number(e.target.value || 0),
                                    )
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Provider</Label>
                            <Input
                                value={data.provider}
                                onChange={(e) =>
                                    setData('provider', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Catatan</Label>
                        <Textarea
                            rows={3}
                            value={data.note}
                            onChange={(e) => setData('note', e.target.value)}
                            placeholder="Opsional"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Lampiran</Label>
                        <Input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) =>
                                setData(
                                    'attachment',
                                    e.target.files?.[0] ?? null,
                                )
                            }
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={close}>
                        Batal
                    </Button>
                    <Button
                        type="button"
                        disabled={!canSubmit}
                        onClick={submit}
                    >
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ManualPaymentDialog;
