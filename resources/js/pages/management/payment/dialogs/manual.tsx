import { useForm } from '@inertiajs/react';
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
import { formatIDR } from '@/lib/format';

export type MethodOption = { value: string; label: string };

export type ManualPaymentDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    methods: MethodOption[];
    initialInvoiceNumber?: string | null;
    invoiceCandidates?: Array<{
        id: string;
        number: string;
        tenant?: string | null;
        room_number?: string | null;
        status: string;
        amount_cents: number;
        outstanding: number;
    }>;
};

type ManualPaymentFormData = {
    invoice_number: string;
    invoice_id: string;
    amount_cents: number | '';
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
    invoiceCandidates = [],
}: ManualPaymentDialogProps) {
    const { data, setData, post, processing, transform, errors } =
        useForm<ManualPaymentFormData>({
            invoice_number: initialInvoiceNumber ?? '',
            invoice_id: '',
            amount_cents: '',
            method: methods?.[0]?.value ?? 'Cash',
            paid_at: '',
            note: '',
            provider: 'Kasir',
            attachment: null,
        });

    // Helper for local datetime-local input default
    const toLocalInput = React.useCallback((d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }, []);

    const defaultMethod = React.useMemo(
        () => methods?.[0]?.value ?? 'Cash',
        [methods],
    );

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

    const selectedMethod = React.useMemo(
        () => methods.find((m) => m.value === data.method),
        [methods, data.method],
    );
    const isTransfer = React.useMemo(() => {
        const v = String(data.method || '').toLowerCase();
        const l = String(selectedMethod?.label || '').toLowerCase();
        return v.includes('transfer') || l.includes('transfer');
    }, [data.method, selectedMethod]);
    const maxOutstanding = React.useMemo(
        () =>
            resolvedInvoice ? Math.max(0, resolvedInvoice.outstanding ?? 0) : 0,
        [resolvedInvoice],
    );
    const remainingAfterPay = React.useMemo(() => {
        const outstanding = Number(resolvedInvoice?.outstanding ?? 0);
        const pay =
            typeof data.amount_cents === 'number' ? data.amount_cents : 0;
        return Math.max(0, outstanding - pay);
    }, [resolvedInvoice, data.amount_cents]);

    const canSubmit =
        !processing &&
        data.invoice_id &&
        (resolvedInvoice?.eligible ?? false) &&
        typeof data.amount_cents === 'number' &&
        data.amount_cents > 0 &&
        data.paid_at.trim().length > 0 &&
        (!isTransfer || Boolean(data.attachment));

    React.useEffect(() => {
        if (!isTransfer && data.attachment) setData('attachment', null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTransfer]);

    const resetForm = React.useCallback(() => {
        setData('invoice_id', '');
        setData('invoice_number', '');
        setData('amount_cents', '');
        setData('method', defaultMethod);
        setData('paid_at', '');
        setData('note', '');
        setData('provider', 'Kasir');
        setData('attachment', null);
        setResolvedInvoice(null);
        setLookupError(null);
    }, [setData, defaultMethod]);

    React.useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open, resetForm]);

    React.useEffect(() => {
        if (open && !data.paid_at) {
            setData('paid_at', toLocalInput(new Date()));
        }
    }, [open, data.paid_at, setData, toLocalInput]);

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

    const invoiceOptions = React.useMemo<SearchOption[]>(() => {
        return invoiceCandidates.map((inv) => ({
            value: inv.id,
            label: `${inv.number} — Kamar ${inv.room_number ?? '-'}`,
            description: inv.tenant ?? undefined,
            payload: inv,
        }));
    }, [invoiceCandidates]);

    React.useEffect(() => {
        const init = (initialInvoiceNumber || '').trim();
        if (!init) return;
        const match = invoiceCandidates.find((i) => i.number === init);
        if (match) {
            setData('invoice_id', match.id);
            setResolvedInvoice({
                id: match.id,
                number: match.number,
                amount: match.amount_cents,
                status: match.status,
                tenant_name: match.tenant ?? null,
                outstanding: match.outstanding,
                eligible:
                    (match.status === 'Pending' ||
                        match.status === 'Overdue') &&
                    (match.outstanding ?? 0) > 0,
            });
        } else {
            setData('invoice_number', init);
            void tryLookupInvoice();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialInvoiceNumber]);

    const submit = React.useCallback(() => {
        if (!canSubmit) return;
        transform((payload) => {
            const out: Record<string, unknown> = { ...payload };
            // Drop attachment for non-transfer to avoid server-side file error
            if (!isTransfer) {
                delete out.attachment;
            }
            // Ensure integer for amount
            out.amount_cents =
                typeof payload.amount_cents === 'number'
                    ? Math.floor(payload.amount_cents)
                    : '';
            return out;
        });
        post(route('management.payments.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => close(),
        });
    }, [canSubmit, post, close]);

    const hasErrors = Boolean(
        errors.invoice_id ||
            errors.method ||
            errors.paid_at ||
            errors.amount_cents ||
            errors.attachment,
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-lg"
                onKeyDown={(e) => {
                    if (
                        e.key === 'Enter' &&
                        (e.metaKey ||
                            e.ctrlKey ||
                            (document.activeElement as HTMLElement)?.tagName !==
                                'TEXTAREA')
                    ) {
                        if (canSubmit) {
                            e.preventDefault();
                            submit();
                        }
                    }
                    if (e.key === 'Escape') {
                        e.stopPropagation();
                        close();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle>Pembayaran Manual</DialogTitle>
                    <p className="text-xs text-muted-foreground">
                        Input pembayaran manual dengan ringkas.
                    </p>
                </DialogHeader>
                {hasErrors ? (
                    <div className="mb-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
                        Periksa kembali input yang belum valid.
                    </div>
                ) : null}
                <div className="space-y-3 text-sm">
                    <div className="space-y-1">
                        <Label>Nomor Invoice</Label>
                        <SearchSelect
                            options={invoiceOptions}
                            value={data.invoice_id || undefined}
                            onChange={(v, opt) => {
                                const payload = (opt?.payload || null) as
                                    | (typeof invoiceCandidates)[number]
                                    | null;
                                setData('invoice_id', v || '');
                                if (payload) {
                                    setResolvedInvoice({
                                        id: payload.id,
                                        number: payload.number,
                                        amount: payload.amount_cents,
                                        status: payload.status,
                                        tenant_name: payload.tenant ?? null,
                                        outstanding: payload.outstanding,
                                        eligible:
                                            (payload.status === 'Pending' ||
                                                payload.status === 'Overdue') &&
                                            (payload.outstanding ?? 0) > 0,
                                    });
                                    setLookupError(null);
                                    if (payload.id) amountRef.current?.focus();
                                } else {
                                    setResolvedInvoice(null);
                                }
                            }}
                            placeholder="Cari invoice…"
                            emptyText={
                                invoiceOptions.length
                                    ? 'Tidak ada hasil'
                                    : 'Belum ada kandidat invoice'
                            }
                        />
                        <InputError message={errors.invoice_id} />
                        {lookupError ? (
                            <div className="mt-0.5 text-xs text-destructive">
                                {lookupError}
                            </div>
                        ) : null}
                        {resolvedInvoice ? (
                            <div
                                className={
                                    'rounded-md border bg-muted/30 p-2 text-[12px] ' +
                                    (errors.invoice_id ? 'mt-1' : 'mt-0')
                                }
                            >
                                <div className="text-muted-foreground">
                                    Nilai: {currency(resolvedInvoice.amount)} ·
                                    Sisa:{' '}
                                    {currency(resolvedInvoice.outstanding ?? 0)}
                                    {resolvedInvoice.tenant_name
                                        ? ` · Penyewa: ${resolvedInvoice.tenant_name}`
                                        : ''}
                                </div>
                                {!resolvedInvoice.eligible ? (
                                    <div className="mt-0.5 text-[11px] text-destructive">
                                        Invoice tidak dapat dibayar (sudah lunas
                                        atau status tidak valid)
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div
                                className={
                                    (errors.invoice_id ? 'mt-0.5 ' : 'mt-0 ') +
                                    'text-xs text-muted-foreground'
                                }
                            >
                                Pilih invoice terlebih dahulu untuk melanjutkan.
                            </div>
                        )}
                    </div>

                    {resolvedInvoice?.eligible ? (
                        <>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>Metode</Label>
                                    <Select
                                        value={data.method}
                                        onValueChange={(v) =>
                                            setData('method', v)
                                        }
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
                                    <InputError message={errors.method} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Tanggal Bayar</Label>
                                    <Input
                                        type="datetime-local"
                                        value={data.paid_at}
                                        onChange={(e) =>
                                            setData('paid_at', e.target.value)
                                        }
                                    />
                                    <InputError message={errors.paid_at} />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1 sm:col-span-2">
                                    <Label>Nilai Bayar</Label>
                                    <div className="relative">
                                        <Input
                                            ref={amountRef}
                                            type="number"
                                            min="0"
                                            max={
                                                resolvedInvoice
                                                    ? Math.max(
                                                          0,
                                                          resolvedInvoice.outstanding ??
                                                              0,
                                                      )
                                                    : undefined
                                            }
                                            value={data.amount_cents}
                                            onChange={(e) => {
                                                const rawStr = e.target.value;
                                                if (rawStr === '') {
                                                    setData('amount_cents', '');
                                                    return;
                                                }
                                                const raw = Number(rawStr);
                                                if (Number.isNaN(raw)) {
                                                    setData('amount_cents', '');
                                                    return;
                                                }
                                                const capped = Math.max(
                                                    0,
                                                    Math.min(
                                                        raw,
                                                        maxOutstanding ||
                                                            Infinity,
                                                    ),
                                                );
                                                setData('amount_cents', capped);
                                            }}
                                            className="pr-2"
                                        />
                                        <InputError
                                            message={errors.amount_cents}
                                        />
                                    </div>
                                    <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>
                                            {typeof data.amount_cents ===
                                                'number' &&
                                            data.amount_cents > 0
                                                ? `Preview: ${formatIDR(data.amount_cents)}`
                                                : ''}
                                        </span>
                                        <button
                                            type="button"
                                            className="text-[12px] underline"
                                            onClick={() =>
                                                setData(
                                                    'amount_cents',
                                                    Number(
                                                        resolvedInvoice?.outstanding ??
                                                            0,
                                                    ),
                                                )
                                            }
                                            disabled={
                                                (resolvedInvoice?.outstanding ??
                                                    0) <= 0
                                            }
                                            title="Isi maksimal (Lunas)"
                                        >
                                            (Lunas)
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <Label>Catatan</Label>
                                <Textarea
                                    rows={3}
                                    value={data.note}
                                    onChange={(e) =>
                                        setData('note', e.target.value)
                                    }
                                    placeholder="Opsional"
                                />
                            </div>

                            {isTransfer ? (
                                <div className="space-y-1">
                                    <Label>Lampiran (Bukti Transfer)</Label>
                                    <Input
                                        type="file"
                                        required
                                        accept="image/*,application/pdf"
                                        onChange={(e) =>
                                            setData(
                                                'attachment',
                                                e.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                    <InputError message={errors.attachment} />
                                </div>
                            ) : null}
                        </>
                    ) : null}
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={close}>
                        Batal
                    </Button>
                    {resolvedInvoice?.eligible ? (
                        <Button
                            type="button"
                            disabled={!canSubmit}
                            onClick={submit}
                        >
                            Simpan
                        </Button>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ManualPaymentDialog;
