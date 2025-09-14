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

    const doLookup = async (override?: string) => {
        const number = (override ?? (invoiceNumberRef.current || '')).trim();
        if (!number) return;
        setLookupLoading(true);
        try {
            const res = await fetch(
                route('management.invoices.lookup') +
                    `?number=${encodeURIComponent(number)}`,
                {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                },
            );
            if (!res.ok) throw new Error('not_found');
            const json = await res.json();
            setResolvedInvoice(json);
            setData((p) => ({ ...p, invoice_id: json.id }));
            setLookupError(null);
            setTimeout(() => amountRef.current?.focus(), 0);
        } catch {
            setResolvedInvoice(null);
            setData((p) => ({ ...p, invoice_id: '' }));
            setLookupError('Invoice tidak ditemukan.');
        } finally {
            setLookupLoading(false);
        }
    };

    React.useEffect(() => {
        if (!open) return;
        setLookupError(null);
        setData((prev) => {
            if (prev.paid_at && prev.paid_at.trim() !== '') return prev;
            const now = new Date();
            const pad = (n: number) => String(n).padStart(2, '0');
            const yyyy = now.getFullYear();
            const mm = pad(now.getMonth() + 1);
            const dd = pad(now.getDate());
            const HH = pad(now.getHours());
            const II = pad(now.getMinutes());
            const ts = `${yyyy}-${mm}-${dd} ${HH}:${II}`;
            return { ...prev, paid_at: ts };
        });
    }, [open, setData]);

    const canSubmit =
        !!data.invoice_id &&
        Number.isFinite(data.amount_cents) &&
        data.amount_cents > 0 &&
        !!data.method &&
        !!resolvedInvoice?.eligible &&
        (data.method !== 'Transfer' || !!data.provider);

    const onSubmit = React.useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!canSubmit) return;
            post(route('management.payments.store'), {
                forceFormData: true,
                onSuccess: () => {
                    setData((p) => ({
                        ...p,
                        invoice_number: '',
                        invoice_id: '',
                        amount_cents: 0,
                        method: p.method,
                        paid_at: '',
                        note: '',
                        provider: p.method === 'Cash' ? 'Kasir' : p.provider,
                        attachment: null,
                    }));
                    setResolvedInvoice(null);
                    onOpenChange(false);
                },
            });
        },
        [canSubmit, onOpenChange, post, setData],
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Tambah Pembayaran Manual</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={onSubmit}>
                    {/* Cari Invoice */}
                    <div className="grid gap-2">
                        <Label>
                            Nomor Invoice{' '}
                            <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                className="flex-1"
                                value={data.invoice_number}
                                onChange={(e) =>
                                    setData((p) => ({
                                        ...p,
                                        invoice_number: e.target.value,
                                    }))
                                }
                                onBlur={(e) =>
                                    setData((p) => ({
                                        ...p,
                                        invoice_number: e.target.value.trim(),
                                    }))
                                }
                                placeholder="cth: INV-202409-ABC123"
                                required
                                aria-required
                                autoComplete="off"
                            />
                            <Button
                                type="button"
                                className="shrink-0"
                                onClick={() => doLookup()}
                                disabled={!data.invoice_number || lookupLoading}
                            >
                                {lookupLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                                        Mencari…
                                    </>
                                ) : (
                                    'Cari'
                                )}
                            </Button>
                        </div>
                        {lookupError && (
                            <div className="text-xs text-red-600">
                                {lookupError}
                            </div>
                        )}
                        {resolvedInvoice ? (
                            <div className="rounded-md border bg-muted/30 p-3 text-xs">
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <div className="text-muted-foreground">
                                            Ditagihkan ke
                                        </div>
                                        <div className="font-medium">
                                            {resolvedInvoice.tenant_name ?? '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">
                                            Nomor Invoice
                                        </div>
                                        <div className="font-mono">
                                            {resolvedInvoice.number}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">
                                            Total Tagihan
                                        </div>
                                        <div className="font-semibold">
                                            {currency(resolvedInvoice.amount)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">
                                            Sisa Tagihan
                                        </div>
                                        <div className="font-semibold">
                                            {currency(
                                                resolvedInvoice.outstanding ??
                                                    0,
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {resolvedInvoice.eligible === false &&
                                    ((resolvedInvoice.outstanding ?? 0) <= 0 ||
                                    [
                                        'Paid',
                                        'Completed',
                                        'Settled',
                                        'Lunas',
                                        'Paid Off',
                                    ].includes(
                                        (resolvedInvoice.status || '').trim(),
                                    ) ? (
                                        <div className="mt-2 rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-700">
                                            Invoice sudah{' '}
                                            <span className="font-semibold">
                                                lunas
                                            </span>
                                            . Tidak perlu ada pembayaran lagi.
                                        </div>
                                    ) : (
                                        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                                            Invoice tidak dapat diproses saat
                                            ini. Status:{' '}
                                            <span className="font-medium">
                                                {resolvedInvoice.status}
                                            </span>
                                            .
                                        </div>
                                    ))}
                            </div>
                        ) : null}
                        <input
                            type="hidden"
                            name="invoice_id"
                            value={data.invoice_id}
                        />
                        <p className="text-xs text-muted-foreground">
                            Catatan: Masukkan nomor invoice lalu klik Cari.
                            Semua nominal Rupiah. Pembayaran manual diverifikasi
                            dan dicatat Completed. Lampiran bukti untuk
                            transfer: JPG/PNG/PDF (maks 5MB).
                        </p>
                    </div>

                    {/* Detail Pembayaran */}
                    {resolvedInvoice && resolvedInvoice.eligible !== false && (
                        <>
                            {/* Nominal */}
                            <div className="grid gap-2">
                                <Label>Nominal</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        ref={amountRef}
                                        className="w-full"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={
                                            Number.isFinite(data.amount_cents)
                                                ? String(data.amount_cents)
                                                : '0'
                                        }
                                        onChange={(e) => {
                                            const onlyDigits =
                                                e.target.value.replace(
                                                    /\D+/g,
                                                    '',
                                                );
                                            const parsed =
                                                onlyDigits === ''
                                                    ? 0
                                                    : Number(onlyDigits);
                                            setData((prev) => ({
                                                ...prev,
                                                amount_cents: Number.isFinite(
                                                    parsed,
                                                )
                                                    ? parsed
                                                    : 0,
                                            }));
                                        }}
                                        onPaste={(e) => {
                                            const text =
                                                e.clipboardData.getData('text');
                                            if (text) {
                                                e.preventDefault();
                                                const onlyDigits = text.replace(
                                                    /\D+/g,
                                                    '',
                                                );
                                                const parsed =
                                                    onlyDigits === ''
                                                        ? 0
                                                        : Number(onlyDigits);
                                                setData((prev) => ({
                                                    ...prev,
                                                    amount_cents:
                                                        Number.isFinite(parsed)
                                                            ? parsed
                                                            : 0,
                                                }));
                                            }
                                        }}
                                        placeholder="Contoh: 150000 untuk Rp 150.000"
                                        required
                                        aria-required
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="shrink-0"
                                        onClick={() => {
                                            const outstanding = Number(
                                                resolvedInvoice?.outstanding ??
                                                    0,
                                            );
                                            if (!Number.isFinite(outstanding))
                                                return;
                                            setData((prev) => ({
                                                ...prev,
                                                amount_cents: Math.max(
                                                    0,
                                                    outstanding,
                                                ),
                                            }));
                                        }}
                                        disabled={
                                            !resolvedInvoice ||
                                            (resolvedInvoice?.outstanding ??
                                                0) <= 0
                                        }
                                        title="Isi nominal dengan sisa tagihan (lunas)"
                                    >
                                        Lunas
                                    </Button>
                                </div>
                                <div className="flex flex-col gap-1 text-[11px] text-muted-foreground md:flex-row md:items-center md:justify-between">
                                    <div>
                                        Sisa tagihan:{' '}
                                        {currency(
                                            resolvedInvoice?.outstanding ?? 0,
                                        )}
                                    </div>
                                    <div>
                                        Pratinjau:{' '}
                                        {formatIDR(
                                            Math.max(0, data.amount_cents || 0),
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Metode & Tanggal */}
                            <div className="grid gap-2 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>
                                        Metode{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={data.method}
                                        onValueChange={(v) =>
                                            setData((p) => ({
                                                ...p,
                                                method: v,
                                                provider:
                                                    v === 'Cash'
                                                        ? 'Kasir'
                                                        : p.provider,
                                            }))
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih metode" />
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
                                <div className="grid gap-2">
                                    <Label>Tanggal & Jam Bayar</Label>
                                    <Input
                                        type="datetime-local"
                                        value={
                                            data.paid_at
                                                ? data.paid_at.replace(' ', 'T')
                                                : ''
                                        }
                                        onChange={(e) =>
                                            setData((p) => ({
                                                ...p,
                                                paid_at: e.target.value
                                                    ? e.target.value.replace(
                                                          'T',
                                                          ' ',
                                                      )
                                                    : '',
                                            }))
                                        }
                                        placeholder="Pilih tanggal dan jam"
                                    />
                                </div>
                            </div>

                            {/* Transfer: Bank & Bukti Transfer */}
                            {data.method === 'Transfer' && (
                                <div className="grid gap-2 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>
                                            Bank{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={data.provider}
                                            onValueChange={(v) =>
                                                setData((p) => ({
                                                    ...p,
                                                    provider: v,
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Pilih bank" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[
                                                    'BCA',
                                                    'Mandiri',
                                                    'BNI',
                                                    'BRI',
                                                    'CIMB',
                                                    'Permata',
                                                    'BTN',
                                                    'BSI',
                                                    'Lainnya',
                                                ].map((b) => (
                                                    <SelectItem
                                                        key={b}
                                                        value={b}
                                                    >
                                                        {b}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>
                                            Bukti Transfer (JPG/PNG/PDF, maks
                                            5MB)
                                        </Label>
                                        <Input
                                            className="w-full"
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) =>
                                                setData((p) => ({
                                                    ...p,
                                                    attachment:
                                                        e.target.files?.[0] ??
                                                        null,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Catatan: tampilkan ketika invoice ditemukan */}
                    {resolvedInvoice && resolvedInvoice.eligible !== false && (
                        <div className="grid gap-2">
                            <Label>Catatan</Label>
                            <Textarea
                                value={data.note}
                                onChange={(e) =>
                                    setData((p) => ({
                                        ...p,
                                        note: e.target.value,
                                    }))
                                }
                                onBlur={(e) =>
                                    setData((p) => ({
                                        ...p,
                                        note: e.target.value.trim(),
                                    }))
                                }
                                rows={3}
                                placeholder="Contoh: pembayaran termin 1"
                                autoComplete="off"
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={!canSubmit || processing}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                                    Menyimpan…
                                </>
                            ) : (
                                'Simpan'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default ManualPaymentDialog;
