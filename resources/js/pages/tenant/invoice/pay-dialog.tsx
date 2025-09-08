import {
    AlertTriangle,
    Banknote,
    CheckCheck,
    Clock,
    Copy,
    QrCode,
    RefreshCw,
    ShieldCheck,
} from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Separator } from '@/components/ui/separator';
import { formatDate, formatIDR } from '@/lib/format';
import { toast } from 'sonner';

// If you have ScrollArea in your project, uncomment the next line:
// import { ScrollArea } from '@/components/ui/scroll-area';

type InvoiceItemMeta = {
    qty?: number;
    unit_price_cents?: number;
};

type InvoiceData = {
    invoice: {
        id: string;
        number: string;
        status: string;
        due_date?: string | null;
        amount_cents: number;
        items: Array<{
            label: string;
            amount_cents: number;
            meta?: InvoiceItemMeta;
        }>;
    };
    payment_summary?: { outstanding: number };
};

type PendingInfo = Partial<{
    payment_type: string;
    bank: string | null;
    va_number: string | null;
    expiry_time: string | null;
    qr_string: string | null;
    actions: Array<{ name?: string; method?: string; url?: string }> | null;
    pdf_url: string | null;
    payment_code: string | null;
    store: string | null;
}>;

function Section({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="border-b px-4 py-3">
                <div className="text-sm font-semibold">{title}</div>
                {subtitle ? (
                    <div className="text-xs text-muted-foreground">
                        {subtitle}
                    </div>
                ) : null}
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

function KVP({
    label,
    value,
    mono = false,
}: {
    label: string;
    value?: React.ReactNode;
    mono?: boolean;
}) {
    return (
        <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className={mono ? 'font-mono' : 'font-medium'}>{value}</div>
        </div>
    );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {n}
            </div>
            <div>
                <div className="text-sm font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
        </div>
    );
}

function useInvoiceLoader(target: { id: string } | null) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<InvoiceData | null>(null);
    React.useEffect(() => {
        const controller = new AbortController();
        async function load() {
            if (!target) return;
            setLoading(true);
            try {
                const res = await fetch(
                    route('tenant.invoices.show', target.id),
                    {
                        headers: { Accept: 'application/json' },
                        credentials: 'same-origin',
                        signal: controller.signal,
                    },
                );
                if (!res.ok) throw new Error('Gagal memuat invoice');
                const json = await res.json();
                setData(json as InvoiceData);
            } catch {
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        load();
        return () => controller.abort();
    }, [target]);
    return { loading, data } as const;
}

function usePendingLoader(target: { id: string } | null) {
    const [loading, setLoading] = React.useState(false);
    const [pending, setPending] = React.useState<PendingInfo | null>(null);
    const load = React.useCallback(async () => {
        if (!target) return;
        setLoading(true);
        try {
            const res = await fetch(
                route('tenant.invoices.pay.status', target.id),
                {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                },
            );
            if (!res.ok) throw new Error('Gagal memuat status');
            const json = await res.json();
            setPending((json?.pending ?? null) as PendingInfo | null);
        } catch {
        } finally {
            setLoading(false);
        }
    }, [target]);
    React.useEffect(() => {
        load();
    }, [load]);
    return { loading, pending, reload: load } as const;
}

function useCountdown(expiry?: string | null) {
    const [remaining, setRemaining] = React.useState<string | null>(null);
    React.useEffect(() => {
        if (!expiry) return setRemaining(null);
        const target = new Date(expiry).getTime();
        const tick = () => {
            const diff = Math.max(0, target - Date.now());
            if (diff <= 0) return setRemaining('00:00:00');
            const h = Math.floor(diff / 3_600_000);
            const m = Math.floor((diff % 3_600_000) / 60_000);
            const s = Math.floor((diff % 60_000) / 1000);
            const pad = (n: number) => String(n).padStart(2, '0');
            setRemaining(`${pad(h)}:${pad(m)}:${pad(s)}`);
        };
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, [expiry]);
    return remaining;
}

export default function TenantInvoicePayDialog({
    target,
    onClose,
}: {
    target: { id: string; number: string } | null;
    onClose: () => void;
}) {
    const open = !!target;
    const { loading, data } = useInvoiceLoader(target);
    const { pending, reload } = usePendingLoader(target);
    const [submitting, setSubmitting] = React.useState(false);
    const [checking, setChecking] = React.useState(false);
    const [bank, setBank] = React.useState<string>('bca');
    const [method, setMethod] = React.useState<'va' | 'qris'>(() =>
        (pending?.payment_type || '').toLowerCase() === 'qris' ? 'qris' : 'va',
    );
    const [copied, setCopied] = React.useState(false);
    const [showMethodPicker, setShowMethodPicker] = React.useState(true);

    const remaining = useCountdown(pending?.expiry_time ?? null);

    React.useEffect(() => {
        setShowMethodPicker(!pending);
    }, [pending]);

    const copyVa = React.useCallback(async (va: string) => {
        try {
            await navigator.clipboard.writeText(va);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            toast.success('Nomor VA disalin.');
        } catch {
            toast.message('Salin manual jika gagal.');
        }
    }, []);

    const checkStatus = React.useCallback(async () => {
        if (!target) return false;
        try {
            setChecking(true);
            const res = await fetch(route('tenant.invoices.show', target.id), {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error(await res.text());
            const json = (await res.json()) as InvoiceData;
            const status = String(json?.invoice?.status || '');
            const outstanding = Number(json?.payment_summary?.outstanding || 0);
            if (status.toLowerCase() === 'paid' || outstanding <= 0) {
                toast.success('Pembayaran lunas.');
                onClose();
                return true;
            }
            toast.message('Belum ada perubahan status.');
            return false;
        } catch (e) {
            console.error(e);
            toast.error('Gagal memeriksa status.');
            return false;
        } finally {
            setChecking(false);
        }
    }, [target, onClose]);

    React.useEffect(() => {
        const t = setInterval(() => {
            checkStatus();
            reload();
        }, 15000);
        return () => clearInterval(t);
    }, [checkStatus, reload]);

    const createVa = React.useCallback(async () => {
        if (!target) return;
        try {
            setSubmitting(true);
            const res = await fetch(
                route('tenant.invoices.pay.midtrans.va', target.id),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            (
                                document.head.querySelector(
                                    'meta[name="csrf-token"]',
                                ) as HTMLMetaElement
                            )?.content || '',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ bank }),
                },
            );
            if (!res.ok) throw new Error(await res.text());
            await res.json();
            toast.success('VA berhasil dibuat.');
            setShowMethodPicker(false);
            await reload();
        } catch (e) {
            console.error(e);
            toast.error('Gagal membuat VA.');
        } finally {
            setSubmitting(false);
        }
    }, [target, bank, reload]);

    const createQris = React.useCallback(async () => {
        if (!target) return;
        try {
            setSubmitting(true);
            const res = await fetch(
                route('tenant.invoices.pay.midtrans.qris', target.id),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            (
                                document.head.querySelector(
                                    'meta[name="csrf-token"]',
                                ) as HTMLMetaElement
                            )?.content || '',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({}),
                },
            );
            if (!res.ok) throw new Error(await res.text());
            await res.json();
            toast.success('QRIS berhasil dibuat.');
            setShowMethodPicker(false);
            await reload();
        } catch (e) {
            console.error(e);
            toast.error('Gagal membuat QRIS.');
        } finally {
            setSubmitting(false);
        }
    }, [target, reload]);

    const inv = data?.invoice;
    const acts = pending?.actions || [];
    const qrUrl =
        (acts || []).find((a) => {
            const n = String(a?.name || '').toLowerCase();
            return (
                n === 'generate-qr-code' ||
                n === 'generate-qr-code-v2' ||
                n.includes('qr-code')
            );
        })?.url || null;

    // QR fallback state/effect
    const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
    React.useEffect(() => {
        let cancelled = false;
        async function gen() {
            setQrDataUrl(null);
            const s = pending?.qr_string;
            if (!s) return;
            try {
                const QR = await import('qrcode');
                const url = await QR.toDataURL(s, {
                    width: 256,
                    margin: 1,
                    errorCorrectionLevel: 'M',
                });
                if (!cancelled) setQrDataUrl(url);
            } catch (e) {
                console.error('QR gen failed', e);
            }
        }
        gen();
        return () => {
            cancelled = true;
        };
    }, [pending?.qr_string]);

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-3">
                        <span>Pembayaran {target?.number ?? ''}</span>
                        <span className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                                {pending?.expiry_time
                                    ? `Berakhir ${formatDate(pending.expiry_time, true)}`
                                    : 'Buat metode untuk memulai'}
                            </span>
                        </span>
                    </DialogTitle>
                    <DialogDescription>
                        Bayar tagihan dengan VA atau QRIS. UI ini sepenuhnya
                        milikmu—tanpa Snap.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Left: Method + Instructions */}
                    <div className="space-y-6 md:col-span-2">
                        {/* Status Banner */}
                        {pending ? (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle className="text-sm font-medium">
                                    Metode siap
                                </AlertTitle>
                                <AlertDescription className="text-xs">
                                    {pending.payment_type ===
                                    'bank_transfer' ? (
                                        <>
                                            Transfer ke VA{' '}
                                            <span className="font-mono">
                                                {pending.va_number}
                                            </span>{' '}
                                            sebelum kadaluarsa.
                                        </>
                                    ) : (
                                        <>
                                            Scan QR sebelum kadaluarsa untuk
                                            menyelesaikan pembayaran.
                                        </>
                                    )}
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert>
                                <ShieldCheck className="h-4 w-4" />
                                <AlertTitle className="text-sm font-medium">
                                    Aman &amp; terverifikasi
                                </AlertTitle>
                                <AlertDescription className="text-xs">
                                    Metode pembayaran dibuat dari sistem kami
                                    dan notifikasi status akan diproses
                                    otomatis.
                                </AlertDescription>
                            </Alert>
                        )}
                        {/* Method Picker */}
                        <Section
                            title="Pilih Metode Pembayaran"
                            subtitle={
                                pending
                                    ? 'Memilih metode baru akan menonaktifkan metode sebelumnya yang masih menunggu.'
                                    : undefined
                            }
                        >
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => setMethod('va')}
                                    className={`flex items-center gap-3 rounded-md border px-3 py-3 text-left transition hover:bg-accent ${method === 'va' ? 'ring-2 ring-primary' : ''}`}
                                >
                                    <Banknote className="h-5 w-5 text-primary" />
                                    <div>
                                        <div className="text-sm font-semibold">
                                            Virtual Account
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            BCA/BNI/BRI/Permata/CIMB
                                        </div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMethod('qris')}
                                    className={`flex items-center gap-3 rounded-md border px-3 py-3 text-left transition hover:bg-accent ${method === 'qris' ? 'ring-2 ring-primary' : ''}`}
                                >
                                    <QrCode className="h-5 w-5 text-primary" />
                                    <div>
                                        <div className="text-sm font-semibold">
                                            QRIS
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Scan pakai mobile banking / e-wallet
                                        </div>
                                    </div>
                                </button>
                            </div>
                            {/* Method Config + CTA */}
                            {method === 'va' ? (
                                <div className="mt-4 space-y-3">
                                    <div>
                                        <Label htmlFor="bank">Pilih bank</Label>
                                        <Select
                                            value={bank}
                                            onValueChange={(v) => setBank(v)}
                                        >
                                            <SelectTrigger
                                                id="bank"
                                                className="h-9"
                                            >
                                                <SelectValue placeholder="Pilih bank" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[
                                                    'bca',
                                                    'bni',
                                                    'bri',
                                                    'permata',
                                                    'cimb',
                                                ].map((b) => (
                                                    <SelectItem
                                                        key={b}
                                                        value={b}
                                                    >
                                                        {b.toUpperCase()}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Button
                                            type="button"
                                            onClick={createVa}
                                            disabled={
                                                submitting ||
                                                (data?.payment_summary
                                                    ?.outstanding ?? 0) <= 0
                                            }
                                            className="h-10 flex-1"
                                        >
                                            Buat VA
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={checkStatus}
                                            disabled={checking}
                                            className="h-10 sm:w-40"
                                        >
                                            {checking
                                                ? 'Memeriksa…'
                                                : 'Periksa status'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    <div className="text-sm text-muted-foreground">
                                        Buat kode untuk dibayar via QRIS.
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Button
                                            type="button"
                                            onClick={createQris}
                                            disabled={
                                                submitting ||
                                                (data?.payment_summary
                                                    ?.outstanding ?? 0) <= 0
                                            }
                                            className="h-10 flex-1"
                                        >
                                            Buat QRIS
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={checkStatus}
                                            disabled={checking}
                                            className="h-10 sm:w-40"
                                        >
                                            {checking
                                                ? 'Memeriksa…'
                                                : 'Periksa status'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Section>
                        {/* Active Instruction */}
                        {pending && !showMethodPicker && (
                            <Section
                                title="Instruksi Pembayaran"
                                subtitle={
                                    pending.payment_type === 'bank_transfer'
                                        ? 'Transfer sesuai nominal tepat agar otomatis terdeteksi.'
                                        : 'Scan QR dari aplikasi mobile banking atau e-wallet.'
                                }
                            >
                                {pending.payment_type === 'bank_transfer' ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            <KVP
                                                label="Bank"
                                                value={
                                                    <span className="font-medium capitalize">
                                                        {pending.bank}
                                                    </span>
                                                }
                                            />
                                            <KVP
                                                label="Nomor VA"
                                                value={
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            readOnly
                                                            value={String(
                                                                pending.va_number ||
                                                                    '',
                                                            )}
                                                            className="font-mono"
                                                        />
                                                        {pending.va_number ? (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="gap-2"
                                                                onClick={() =>
                                                                    copyVa(
                                                                        String(
                                                                            pending.va_number,
                                                                        ),
                                                                    )
                                                                }
                                                            >
                                                                {copied ? (
                                                                    <CheckCheck className="h-4 w-4" />
                                                                ) : (
                                                                    <Copy className="h-4 w-4" />
                                                                )}
                                                                {copied
                                                                    ? 'Tersalin'
                                                                    : 'Salin'}
                                                            </Button>
                                                        ) : null}
                                                    </div>
                                                }
                                            />
                                            <KVP
                                                label="Berlaku hingga"
                                                value={
                                                    pending.expiry_time
                                                        ? formatDate(
                                                              pending.expiry_time,
                                                              true,
                                                          )
                                                        : '-'
                                                }
                                            />
                                        </div>
                                        <Separator />
                                        <div className="space-y-3">
                                            <Step
                                                n={1}
                                                title="Buka aplikasi bank"
                                                desc="Pilih menu transfer ke Virtual Account."
                                            />
                                            <Step
                                                n={2}
                                                title="Masukkan nomor VA"
                                                desc="Tempel nomor VA yang telah disalin."
                                            />
                                            <Step
                                                n={3}
                                                title="Cek nominal"
                                                desc="Pastikan nominal sesuai tagihan. Lanjutkan pembayaran."
                                            />
                                        </div>
                                        <div className="pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={checkStatus}
                                                disabled={checking}
                                                className="gap-2"
                                            >
                                                <RefreshCw className="h-4 w-4" />{' '}
                                                {checking
                                                    ? 'Memeriksa…'
                                                    : 'Periksa status'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            {qrUrl || qrDataUrl ? (
                                                <img
                                                    src={
                                                        qrUrl || qrDataUrl || ''
                                                    }
                                                    alt="QRIS"
                                                    className="h-56 w-56 rounded bg-white p-2 shadow"
                                                />
                                            ) : (
                                                <div className="text-sm text-muted-foreground">
                                                    QR belum tersedia. Klik
                                                    "Buat QRIS" atau coba lagi.
                                                </div>
                                            )}
                                            <div className="space-y-2 text-xs text-muted-foreground">
                                                <div>
                                                    QR kadaluarsa pada:{' '}
                                                    {pending.expiry_time
                                                        ? formatDate(
                                                              pending.expiry_time,
                                                              true,
                                                          )
                                                        : '-'}
                                                </div>
                                                <div>
                                                    Gunakan aplikasi mobile
                                                    banking / e-wallet yang
                                                    mendukung QRIS.
                                                </div>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="space-y-3">
                                            <Step
                                                n={1}
                                                title="Buka aplikasi pembayaran"
                                                desc="Pilih menu scan QR."
                                            />
                                            <Step
                                                n={2}
                                                title="Arahkan kamera ke QR"
                                                desc="Pastikan nominal sesuai, lalu konfirmasi."
                                            />
                                            <Step
                                                n={3}
                                                title="Selesai"
                                                desc="Tunggu notifikasi berhasil. Status akan ter-update otomatis."
                                            />
                                        </div>
                                        <div className="pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={checkStatus}
                                                disabled={checking}
                                                className="gap-2"
                                            >
                                                <RefreshCw className="h-4 w-4" />{' '}
                                                {checking
                                                    ? 'Memeriksa…'
                                                    : 'Periksa status'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Section>
                        )}
                    </div>
                    {/* Right: Summary & Help */}
                    <div className="space-y-6 md:col-span-1">
                        <Section title="Ringkasan Pembayaran">
                            <div className="grid grid-cols-2 gap-4">
                                <KVP
                                    label="No. Invoice"
                                    value={inv?.number}
                                    mono
                                />
                                <KVP
                                    label="Jatuh tempo"
                                    value={formatDate(
                                        String(inv?.due_date || ''),
                                    )}
                                />
                                <KVP
                                    label="Nominal"
                                    value={
                                        <span className="font-semibold">
                                            {formatIDR(inv?.amount_cents || 0)}
                                        </span>
                                    }
                                />
                                <KVP
                                    label="Sisa"
                                    value={
                                        <span className="font-semibold">
                                            {formatIDR(
                                                data?.payment_summary
                                                    ?.outstanding || 0,
                                            )}
                                        </span>
                                    }
                                />
                            </div>
                        </Section>
                        <Section title="Bantuan">
                            <div className="space-y-2 text-xs text-muted-foreground">
                                <div>
                                    • Pembayaran diproses otomatis begitu kami
                                    menerima notifikasi dari bank.
                                </div>
                                <div>
                                    • Jika kadaluarsa, buat metode baru dan coba
                                    lagi.
                                </div>
                                <div>
                                    • Simpan bukti transfer untuk verifikasi
                                    jika diperlukan.
                                </div>
                            </div>
                        </Section>
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onClose()}
                                className="h-9"
                            >
                                Tutup
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
